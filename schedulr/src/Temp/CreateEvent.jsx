import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function CreateEvent() {
  const navigate = useNavigate();

  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dayCount, setDayCount] = useState(1);
  const [eventId, setEventId] = useState("");
  const [copiedMessage, setCopiedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const formatDateLabel = (date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const month = date.toLocaleDateString("en-US", { month: "numeric" });
    const day = date.toLocaleDateString("en-US", { day: "numeric" });
    return `${weekday} ${month}/${day}`;
  };

  const buildDateRange = (startDateString, numberOfDays) => {
    const result = [];
    const start = new Date(`${startDateString}T00:00:00`);

    for (let i = 0; i < numberOfDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);

      result.push({
        iso: current.toISOString().split("T")[0],
        label: formatDateLabel(current),
      });
    }

    return result;
  };

  const generateEventId = () => {
    const trimmedName = eventName.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter an event name.");
      setEventId("");
      return;
    }

    if (!startDate) {
      setErrorMessage("Please choose a start date.");
      setEventId("");
      return;
    }

    const baseSlug = slugify(trimmedName);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newEventId = `${baseSlug}-${randomSuffix}`;
    const selectedDates = buildDateRange(startDate, Number(dayCount));

    setEventId(newEventId);
    setCopiedMessage("");
    setErrorMessage("");

    const existingEventMeta =
      JSON.parse(localStorage.getItem("schedulr-event-meta")) || {};

    existingEventMeta[newEventId] = {
      name: trimmedName,
      createdAt: new Date().toISOString(),
      startDate,
      dayCount: Number(dayCount),
      selectedDates,
    };

    localStorage.setItem(
      "schedulr-event-meta",
      JSON.stringify(existingEventMeta)
    );
  };

  const eventLink = eventId
    ? `${window.location.origin}/event/${eventId}`
    : "";

  const handleCopyLink = async () => {
    if (!eventLink) return;

    try {
      await navigator.clipboard.writeText(eventLink);
      setCopiedMessage("Link copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy link:", error);
      setCopiedMessage("Could not copy link.");
    }
  };

  const handleOpenEvent = () => {
    if (!eventId) return;
    navigate(`/event/${eventId}`);
  };

  return (
    <main className="event-page">
      <div className="event-layout">
        <section className="event-card">
          <p className="section-tag">Create Event</p>
          <h1 className="event-title">Create a New Scheduling Event</h1>
          <p className="event-subtitle">
            Enter an event name, choose a start date, and select how many days
            participants can respond to.
          </p>

          <div className="form-group">
            <label htmlFor="event-name" className="form-label">
              Event Name
            </label>
            <input
              id="event-name"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="start-date" className="form-label">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="day-count" className="form-label">
              Number of Days
            </label>
            <select
              id="day-count"
              value={dayCount}
              onChange={(e) => setDayCount(e.target.value)}
              className="form-input"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <option key={num} value={num}>
                  {num} Day{num !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="submit-button"
            onClick={generateEventId}
          >
            Generate Event Link
          </button>

          {errorMessage && <p className="status-message">{errorMessage}</p>}

          {eventId && (
            <div className="generated-link-box">
              <p className="form-label">Event Name</p>
              <p className="event-meta">{eventName}</p>

              <p className="form-label">Generated Event ID</p>
              <p className="event-meta">{eventId}</p>

              <p className="form-label">Selected Dates</p>
              <div className="link-display">
                {buildDateRange(startDate, Number(dayCount))
                  .map((date) => date.label)
                  .join(", ")}
              </div>

              <p className="form-label">Shareable Link</p>
              <div className="link-display">{eventLink}</div>

              <div className="create-actions">
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleCopyLink}
                >
                  Copy Link
                </button>

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={handleOpenEvent}
                >
                  Open Event Page
                </button>
              </div>

              {copiedMessage && (
                <p className="status-message">{copiedMessage}</p>
              )}
            </div>
          )}
        </section>

        <aside className="participants-card">
          <p className="section-tag">How It Works</p>
          <h2>Create and Share</h2>
          <p className="helper-text">
            Choose the event date range, generate a unique link, and send it to
            participants. They will only see the dates selected for this event.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default CreateEvent;