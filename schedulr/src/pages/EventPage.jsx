import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function EventPage() {
  const { eventId } = useParams();

  const timeSlots = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"];
  const [participantName, setParticipantName] = useState("");
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [savedParticipants, setSavedParticipants] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`event-${eventId}`);
      if (!savedData) return;

      const parsedData = JSON.parse(savedData);
      if (Array.isArray(parsedData)) {
        setSavedParticipants(parsedData);
      } else {
        setSavedParticipants([]);
      }
    } catch (error) {
      console.error("Failed to load saved participants:", error);
      setSavedParticipants([]);
    }
  }, [eventId]);

  const toggleTimeSlot = (time) => {
    setSelectedTimes((prevSelected) =>
      prevSelected.includes(time)
        ? prevSelected.filter((slot) => slot !== time)
        : [...prevSelected, time]
    );
  };

  const handleSubmit = () => {
    const trimmedName = participantName.trim();

    if (!trimmedName) {
      setMessage("Please enter your name.");
      return;
    }

    if (selectedTimes.length === 0) {
      setMessage("Please select at least one available time.");
      return;
    }

    try {
      const existingRaw = localStorage.getItem(`event-${eventId}`);
      const existingData = existingRaw ? JSON.parse(existingRaw) : [];
      const safeExistingData = Array.isArray(existingData) ? existingData : [];

      const updatedParticipants = [
        ...safeExistingData,
        {
          name: trimmedName,
          availability: selectedTimes,
        },
      ];

      localStorage.setItem(
        `event-${eventId}`,
        JSON.stringify(updatedParticipants)
      );

      setSavedParticipants(updatedParticipants);
      setMessage("Availability submitted successfully.");
      setParticipantName("");
      setSelectedTimes([]);
    } catch (error) {
      console.error("Failed to save participant data:", error);
      setMessage("There was an error saving availability.");
    }
  };

  return (
    <main style={{ padding: "40px", color: "white" }}>
      <h1>Event Availability</h1>
      <p>
        <strong>Event ID:</strong> {eventId}
      </p>

      <div style={{ marginTop: "20px", maxWidth: "320px" }}>
        <label
          htmlFor="participant-name"
          style={{ display: "block", marginBottom: "8px" }}
        >
          Your Name
        </label>
        <input
          id="participant-name"
          type="text"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          placeholder="Enter your name"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #444",
            backgroundColor: "#18181f",
            color: "white",
            marginBottom: "20px",
          }}
        />
      </div>

      <p>Select the times you are available:</p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "320px",
          marginTop: "20px",
        }}
      >
        {timeSlots.map((time) => (
          <button
            key={time}
            onClick={() => toggleTimeSlot(time)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #444",
              backgroundColor: selectedTimes.includes(time)
                ? "#a855f7"
                : "#18181f",
              color: "white",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {time} {selectedTimes.includes(time) ? "✓" : ""}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "24px",
          padding: "12px 18px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: "#a855f7",
          color: "white",
          cursor: "pointer",
        }}
      >
        Submit Availability
      </button>

      {message && <p style={{ marginTop: "16px" }}>{message}</p>}

      <div style={{ marginTop: "32px" }}>
        <h2>Submitted Participants</h2>
        {savedParticipants.length > 0 ? (
          <ul>
            {savedParticipants.map((participant, index) => (
              <li key={index} style={{ marginBottom: "12px" }}>
                <strong>{participant.name}</strong>:{" "}
                {Array.isArray(participant.availability)
                  ? participant.availability.join(", ")
                  : "No availability recorded"}
              </li>
            ))}
          </ul>
        ) : (
          <p>No participant submissions yet.</p>
        )}
      </div>
    </main>
  );
}

export default EventPage;