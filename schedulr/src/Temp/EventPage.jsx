import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../App.css";

function EventPage() {
  const { eventId } = useParams();

  const [days, setDays] = useState([]);
  const times = Array.from({ length: 24 }, (_, i) => {
    const hour12 = i % 12 === 0 ? 12 : i % 12;
    const suffix = i < 12 ? "AM" : "PM";
    return `${hour12}:00${suffix}`;
  });

  const [participantName, setParticipantName] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [savedParticipants, setSavedParticipants] = useState([]);
  const [message, setMessage] = useState("");
  const [eventName, setEventName] = useState("");
  const [dayCount, setDayCount] = useState(0);

  const calendarColumnStyle = {
    gridTemplateColumns: `110px repeat(${Math.max(days.length, 1)}, minmax(120px, 1fr))`,
  };

  const getAvailabilityCount = (slotKey) => {
    return savedParticipants.reduce((count, participant) => {
      if (
        Array.isArray(participant.availability) &&
        participant.availability.includes(slotKey)
      ) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const rankTimeSlots = () => {
    const rankedSlots = [];

    days.forEach((day) => {
      times.forEach((time) => {
        const slotKey = `${day.iso}-${time}`;
        const availableCount = getAvailabilityCount(slotKey);

        rankedSlots.push({
          slot: slotKey,
          dayIso: day.iso,
          dayLabel: day.label,
          time,
          count: availableCount,
        });
      });
    });

    return rankedSlots.sort((a, b) => b.count - a.count);
  };

  const rankedSlots = rankTimeSlots();
  const topRecommendations = rankedSlots.slice(0, 3);
  const bestSlot = topRecommendations[0];

  const getHintClassName = (count) => {
    if (count === 0) return "hint-none";
    if (count === 1) return "hint-low";
    if (count === 2) return "hint-medium";
    return "hint-high";
  };

  const renderDayHeader = (day) => {
    const [weekday = "", date = ""] = day.label.split(" ");
    return (
      <>
        <span>{weekday}</span>
        <br />
        <span>{date}</span>
      </>
    );
  };

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`event-${eventId}`);
      if (!savedData) {
        setSavedParticipants([]);
        return;
      }

      const parsedData = JSON.parse(savedData);
      setSavedParticipants(Array.isArray(parsedData) ? parsedData : []);
    } catch (error) {
      console.error("Failed to load saved participants:", error);
      setSavedParticipants([]);
    }
  }, [eventId]);

  useEffect(() => {
    try {
      const metaRaw = localStorage.getItem("schedulr-event-meta");
      if (!metaRaw) return;

      const meta = JSON.parse(metaRaw);

      if (meta[eventId]) {
        const eventMeta = meta[eventId];

        setEventName(eventMeta.name || "");
        setDayCount(eventMeta.dayCount || 0);
        setDays(
          Array.isArray(eventMeta.selectedDates) ? eventMeta.selectedDates : []
        );
      }
    } catch (error) {
      console.error("Failed to load event name and dates:", error);
    }
  }, [eventId]);

  const toggleSlot = (dayIso, time) => {
    const slotKey = `${dayIso}-${time}`;

    setSelectedSlots((prevSelected) =>
      prevSelected.includes(slotKey)
        ? prevSelected.filter((slot) => slot !== slotKey)
        : [...prevSelected, slotKey]
    );
  };

  const handleSubmit = () => {
    const trimmedName = participantName.trim();

    if (!trimmedName) {
      setMessage("Please enter your name.");
      return;
    }

    if (selectedSlots.length === 0) {
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
          availability: selectedSlots,
        },
      ];

      localStorage.setItem(
        `event-${eventId}`,
        JSON.stringify(updatedParticipants)
      );

      setSavedParticipants(updatedParticipants);
      setParticipantName("");
      setSelectedSlots([]);
      setMessage("Availability submitted successfully.");
    } catch (error) {
      console.error("Failed to save participant data:", error);
      setMessage("There was an error saving availability.");
    }
  };

  return (
    <main className="event-page">
      <div className="event-layout">
        <section className="event-card">
          <p className="section-tag">Participant Submission</p>

          <h1 className="event-title">
            {eventName || "Submit Your Availability"}
          </h1>

          <p className="event-subtitle">
            Select every day and time that works for you.
          </p>

          <p className="event-meta">
            <strong>Event ID:</strong> {eventId}
          </p>

          <p className="event-meta">
            <strong>Date Range:</strong>{" "}
            {days.length > 0
              ? days.map((day) => day.label).join(", ")
              : "Not set"}
          </p>

          <p className="event-meta">
            <strong>Number of Days:</strong> {dayCount || days.length}
          </p>

          <div className="form-group">
            <label htmlFor="participant-name" className="form-label">
              Your Name
            </label>
            <input
              id="participant-name"
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <p className="form-label">Group Availability Hint</p>
            <p className="helper-text">
              This shows how many previously submitted participants are available
              in each time slot.
            </p>

            <div className="hint-calendar" style={calendarColumnStyle}>
              <div className="calendar-header empty-cell"></div>
              {days.map((day) => (
                <div key={`hint-${day.iso}`} className="calendar-header">
                  {renderDayHeader(day)}
                </div>
              ))}

              {times.map((time) => (
                <div className="calendar-row" key={`hint-row-${time}`}>
                  <div className="calendar-time-label">{time}</div>

                  {days.map((day) => {
                    const slotKey = `${day.iso}-${time}`;
                    const count = getAvailabilityCount(slotKey);

                    return (
                      <div
                        key={`hint-${slotKey}`}
                        className={`hint-cell ${getHintClassName(count)}`}
                      >
                        {count}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <p className="form-label">Recommended Meeting Times</p>
            <p className="helper-text">
              These suggestions are ranked by how many submitted participants are
              available.
            </p>

            {topRecommendations.length > 0 ? (
              <div className="recommendation-list">
                {topRecommendations.map((recommendation, index) => (
                  <div
                    key={recommendation.slot}
                    className={`recommendation-card ${
                      index === 0 ? "best" : ""
                    }`}
                  >
                    <div className="recommendation-rank">#{index + 1}</div>
                    <div className="recommendation-content">
                      <h3>
                        {recommendation.dayLabel} {recommendation.time}
                      </h3>
                      <p>
                        {recommendation.count} participant
                        {recommendation.count !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                No recommendations yet. Submit participant availability to see
                the best meeting times.
              </p>
            )}

            {bestSlot && bestSlot.count > 0 && (
              <div className="ai-summary">
                <p className="ai-summary-label">Why this is recommended</p>
                <p>
                  The best current option is{" "}
                  <strong>
                    {bestSlot.dayLabel} {bestSlot.time}
                  </strong>{" "}
                  because it has the highest overlap, with{" "}
                  <strong>{bestSlot.count}</strong> submitted participant
                  {bestSlot.count !== 1 ? "s" : ""} available.
                </p>
              </div>
            )}
          </div>

          <div
            className="availability-calendar"
            style={calendarColumnStyle}
          >
            <div className="calendar-header empty-cell"></div>
            {days.map((day) => (
              <div key={day.iso} className="calendar-header">
                {renderDayHeader(day)}
              </div>
            ))}

            {times.map((time) => (
              <div className="calendar-row" key={time}>
                <div className="calendar-time-label">{time}</div>

                {days.map((day) => {
                  const slotKey = `${day.iso}-${time}`;
                  const isSelected = selectedSlots.includes(slotKey);

                  return (
                    <button
                      key={slotKey}
                      type="button"
                      className={`calendar-cell ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSlot(day.iso, time)}
                    >
                      {isSelected ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="submit-button"
            onClick={handleSubmit}
          >
            Submit Availability
          </button>

          {message && <p className="status-message">{message}</p>}
        </section>

        <aside className="participants-card">
          <p className="section-tag">Current Responses</p>
          <h2>Submitted Participants</h2>

          {savedParticipants.length > 0 ? (
            <div className="submitted-participants">
              {savedParticipants.map((participant, index) => (
                <div key={index} className="participant-calendar-card">
                  <h3 className="participant-name">{participant.name}</h3>

                  <div
                    className="submitted-calendar"
                    style={calendarColumnStyle}
                  >
                    <div className="calendar-header empty-cell"></div>
                    {days.map((day) => (
                      <div
                        key={`${participant.name}-${day.iso}`}
                        className="calendar-header"
                      >
                        {renderDayHeader(day)}
                      </div>
                    ))}

                    {times.map((time) => (
                      <div
                        className="calendar-row"
                        key={`${participant.name}-${time}`}
                      >
                        <div className="calendar-time-label">{time}</div>

                        {days.map((day) => {
                          const slotKey = `${day.iso}-${time}`;
                          const isAvailable =
                            Array.isArray(participant.availability) &&
                            participant.availability.includes(slotKey);

                          return (
                            <div
                              key={`${participant.name}-${slotKey}`}
                              className={`submitted-calendar-cell ${
                                isAvailable ? "available" : "unavailable"
                              }`}
                            >
                              {isAvailable ? "Available" : "Unavailable"}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No participant submissions yet.</p>
          )}
        </aside>
      </div>
    </main>
  );
}

export default EventPage;