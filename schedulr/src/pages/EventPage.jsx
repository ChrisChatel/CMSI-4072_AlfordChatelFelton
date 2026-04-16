import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../App.css";

// ---------------------------------------------------------------------------
// 5.2.3.2 — Recommendation engine
// Scores every time slot by:
//   - `count`       : number of participants available (higher = better)
//   - `percentage`  : count / totalParticipants (shown in UI)
//   - `tier`        : "all" | "most" | "some" — lets organizer filter
// ---------------------------------------------------------------------------
function buildRecommendations(days, times, participants) {
  const total = participants.length;
  const ranked = [];

  days.forEach((day) => {
    times.forEach((time) => {
      const slotKey = `${day.iso}-${time}`;

      const availableParticipants = participants.filter(
        (p) =>
          Array.isArray(p.availability) && p.availability.includes(slotKey)
      );

      const count = availableParticipants.length;
      if (count === 0) return; // skip empty slots entirely

      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      let tier = "some";
      if (count === total) tier = "all";
      else if (count >= Math.ceil(total * 0.5)) tier = "most";

      ranked.push({
        slot: slotKey,
        dayIso: day.iso,
        dayLabel: day.label,
        time,
        count,
        total,
        percentage,
        tier,
        availableNames: availableParticipants.map((p) => p.name),
      });
    });
  });

  // Sort: most attendees first; break ties by earlier time
  return ranked.sort((a, b) => b.count - a.count || a.slot.localeCompare(b.slot));
}

function TierBadge({ tier }) {
  const labels = { all: "All available", most: "Most available", some: "Some available" };
  return <span className={`tier-badge tier-${tier}`}>{labels[tier]}</span>;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 5.2.3.3 — filter state for organizer view
  const [tierFilter, setTierFilter] = useState("all"); // "all" | "most" | "some"

  const calendarColumnStyle = {
    gridTemplateColumns: `110px repeat(${Math.max(days.length, 1)}, minmax(120px, 1fr))`,
  };

  // ---------------------------------------------------------------------------
  // 5.2.3.1 — Load event + all participant data from Supabase
  // ---------------------------------------------------------------------------
  const loadEventData = useCallback(async () => {
    setIsLoading(true);

    // Load event metadata
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("name, day_count, selected_dates")
      .eq("id", eventId)
      .single();

    if (eventError) {
      console.error("Failed to load event:", eventError);
    } else if (eventData) {
      setEventName(eventData.name || "");
      setDayCount(eventData.day_count || 0);
      setDays(
        Array.isArray(eventData.selected_dates) ? eventData.selected_dates : []
      );
    }

    // Load all participant submissions for this event
    const { data: participantData, error: participantError } = await supabase
      .from("participants")
      .select("name, availability")
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: true });

    if (participantError) {
      console.error("Failed to load participants:", participantError);
      setSavedParticipants([]);
    } else {
      setSavedParticipants(participantData || []);
    }

    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // ---------------------------------------------------------------------------
  // 5.2.3.2 — Compute recommendations from live participant data
  // ---------------------------------------------------------------------------
  const allRecommendations = buildRecommendations(days, times, savedParticipants);

  const filteredRecommendations = allRecommendations.filter((r) => {
    if (tierFilter === "all") return r.tier === "all";
    if (tierFilter === "most") return r.tier === "all" || r.tier === "most";
    return true; // "some" shows everything
  });

  const topRecommendations = filteredRecommendations.slice(0, 5);
  const bestSlot = allRecommendations[0]; // always the absolute best

  // ---------------------------------------------------------------------------
  // Availability hint helpers (unchanged logic, same visual)
  // ---------------------------------------------------------------------------
  const getAvailabilityCount = (slotKey) =>
    savedParticipants.reduce((count, p) => {
      return Array.isArray(p.availability) && p.availability.includes(slotKey)
        ? count + 1
        : count;
    }, 0);

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

  const toggleSlot = (dayIso, time) => {
    const slotKey = `${dayIso}-${time}`;
    setSelectedSlots((prev) =>
      prev.includes(slotKey) ? prev.filter((s) => s !== slotKey) : [...prev, slotKey]
    );
  };

  // ---------------------------------------------------------------------------
  // Submit participant — writes to Supabase, then reloads
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    const trimmedName = participantName.trim();

    if (!trimmedName) {
      setMessage("Please enter your name.");
      return;
    }
    if (selectedSlots.length === 0) {
      setMessage("Please select at least one available time.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("participants").insert({
      event_id: eventId,
      name: trimmedName,
      availability: selectedSlots,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Failed to save participant:", error);
      setMessage("There was an error saving your availability.");
      return;
    }

    setParticipantName("");
    setSelectedSlots([]);
    setMessage("Availability submitted successfully.");

    // 5.2.3.1 — Reload all participant data so recommendations update immediately
    await loadEventData();
  };

  if (isLoading) {
    return (
      <main className="event-page">
        <div className="event-layout">
          <section className="event-card">
            <p className="event-subtitle">Loading event...</p>
          </section>
        </div>
      </main>
    );
  }

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
            {days.length > 0 ? days.map((d) => d.label).join(", ") : "Not set"}
          </p>

          <p className="event-meta">
            <strong>Number of Days:</strong> {dayCount || days.length}
          </p>

          {/* ----------------------------------------------------------------
              5.2.3.3 — Meeting time recommendations for the organizer
          ---------------------------------------------------------------- */}
          <div className="form-group">
            <p className="form-label">Recommended Meeting Times</p>
            <p className="helper-text">
              Ranked by number of participants who can attend. Use the filter to
              find times where everyone — or most people — are free.
            </p>

            {/* Tier filter */}
            {savedParticipants.length > 0 && (
              <div className="tier-filter">
                {["all", "most", "some"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tier-filter-btn ${tierFilter === t ? "active" : ""}`}
                    onClick={() => setTierFilter(t)}
                  >
                    {t === "all" && "Everyone"}
                    {t === "most" && "Most (≥50%)"}
                    {t === "some" && "Any overlap"}
                  </button>
                ))}
              </div>
            )}

            {topRecommendations.length > 0 ? (
              <div className="recommendation-list">
                {topRecommendations.map((rec, index) => (
                  <div
                    key={rec.slot}
                    className={`recommendation-card ${index === 0 ? "best" : ""}`}
                  >
                    <div className="recommendation-rank">#{index + 1}</div>
                    <div className="recommendation-content">
                      <h3>
                        {rec.dayLabel} at {rec.time}
                      </h3>
                      <p>
                        <strong>{rec.count}</strong> of {rec.total} participant
                        {rec.total !== 1 ? "s" : ""} available ({rec.percentage}%)
                      </p>
                      <p className="rec-names">{rec.availableNames.join(", ")}</p>
                      <TierBadge tier={rec.tier} />
                    </div>

                    {/* Percentage bar */}
                    <div className="rec-bar-track">
                      <div
                        className={`rec-bar-fill tier-fill-${rec.tier}`}
                        style={{ width: `${rec.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : savedParticipants.length === 0 ? (
              <p className="empty-state">
                No submissions yet. Share the link so participants can fill in
                their availability.
              </p>
            ) : (
              <p className="empty-state">
                No slots match this filter. Try "Most" or "Any overlap".
              </p>
            )}

            {bestSlot && bestSlot.count > 0 && (
              <div className="ai-summary">
                <p className="ai-summary-label">Best option right now</p>
                <p>
                  <strong>
                    {bestSlot.dayLabel} at {bestSlot.time}
                  </strong>{" "}
                  has the highest attendance —{" "}
                  <strong>{bestSlot.count}</strong> of {bestSlot.total}{" "}
                  participant{bestSlot.total !== 1 ? "s" : ""} (
                  {bestSlot.percentage}%) are available.
                  {bestSlot.tier === "all" &&
                    " This works for everyone."}
                  {bestSlot.tier === "most" &&
                    " This works for more than half your group."}
                  {bestSlot.tier === "some" &&
                    " No time works for everyone yet — this is the best available overlap."}
                </p>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------
              5.2.3.1 — Group availability hint grid
          ---------------------------------------------------------------- */}
          <div className="form-group">
            <p className="form-label">Group Availability Hint</p>
            <p className="helper-text">
              Number of participants available in each slot across all {savedParticipants.length} submission{savedParticipants.length !== 1 ? "s" : ""}.
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

          {/* Participant availability selector */}
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

          <div className="availability-calendar" style={calendarColumnStyle}>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Availability"}
          </button>

          {message && <p className="status-message">{message}</p>}
        </section>

        {/* ------------------------------------------------------------------
            Sidebar — submitted participants list
        ------------------------------------------------------------------ */}
        <aside className="participants-card">
          <p className="section-tag">Current Responses</p>
          <h2>Submitted Participants</h2>
          <p className="helper-text">{savedParticipants.length} response{savedParticipants.length !== 1 ? "s" : ""} so far.</p>

          {savedParticipants.length > 0 ? (
            <div className="submitted-participants">
              {savedParticipants.map((participant, index) => (
                <div key={index} className="participant-calendar-card">
                  <h3 className="participant-name">{participant.name}</h3>

                  <div className="submitted-calendar" style={calendarColumnStyle}>
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
