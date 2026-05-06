import { useState } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const [previewSlots, setPreviewSlots] = useState([
    "open",
    "open",
    "busy",
    "open",
    "open",
    "busy",
    "open",
    "open",
  ]);

  const togglePreviewSlot = (index) => {
    setPreviewSlots((slots) =>
      slots.map((slot, i) =>
        i === index ? (slot === "open" ? "busy" : "open") : slot
      )
    );
  };

  return (
    <main className="app">
      <nav className="navbar">
        <div className="logo">Schedulr</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#preview">Preview</a>
          <a href="#about">About</a>
        </div>
        <button className="nav-button" onClick={() => navigate("/create")}>
          Get Started
        </button>
      </nav>

      <header className="hero">
        <p className="eyebrow">Smarter group scheduling</p>
        <h1>Plan together without the chaos.</h1>
        <p className="subtitle">
          Schedulr helps students and groups compare availability, organize
          plans, and find the best time to meet — all in one place.
        </p>
        <div className="hero-buttons">
          <button onClick={() => navigate("/create")}>Start Scheduling</button>
          <button
            className="secondary"
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See Features
          </button>
        </div>
      </header>

      <section className="preview-section" id="preview">
        <div className="preview-text">
          <p className="section-tag">Live Preview</p>
          <h2>See everyone’s availability at a glance</h2>
          <p>
            Stop juggling screenshots, texts, and random messages. Schedulr puts
            everyone’s time blocks in one clean view so your group can quickly
            decide what works.
          </p>
        </div>

        <div className="schedule-card">
          <div className="schedule-header">
            <span>Group Availability</span>
            <span className="status-pill">4 people</span>
          </div>

          <div className="schedule-grid">
            {["9 AM", "11 AM", "1 PM", "3 PM"].map((time, rowIndex) => (
              <div className="schedule-row" key={time}>
                <div className="time">{time}</div>

                {[0, 1].map((colIndex) => {
                  const slotIndex = rowIndex * 2 + colIndex;
                  const status = previewSlots[slotIndex];

                  return (
                    <button
                      key={`${time}-${colIndex}`}
                      type="button"
                      className={`slot ${status}`}
                      onClick={() => togglePreviewSlot(slotIndex)}
                    >
                      {status === "open" ? "Open" : "Busy"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <h2>Features</h2>
        <div className="card-grid">
          <article className="card">
            <h3>Compare Availability</h3>
            <p>Quickly see overlapping free times across your group.</p>
          </article>

          <article className="card">
            <h3>Plan Events Faster</h3>
            <p>
              Turn possible times into actual plans without endless
              back-and-forth.
            </p>
          </article>

          <article className="card">
            <h3>Cleaner Coordination</h3>
            <p>Keep scheduling organized instead of buried in messages.</p>
          </article>
        </div>
      </section>

      <footer className="footer" id="about">
        <p>Schedulr — Senior Project concept for simpler student scheduling.</p>
      </footer>
    </main>
  );
}

export default Home;
