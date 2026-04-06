import { useState } from "react";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  const [slots, setSlots] = useState([
    ["Open", "Open"],
    ["Busy", "Open"],
    ["Open", "Busy"],
    ["Open", "Open"],
  ]);

  const times = ["9 AM", "11 AM", "1 PM", "3 PM"];

  const handleLogin = () => {
    setUser({ name: "Chris" });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const toggleSlot = (rowIndex, colIndex) => {
    setSlots((prevSlots) =>
      prevSlots.map((row, r) =>
        r === rowIndex
          ? row.map((slot, c) =>
              c === colIndex ? (slot === "Open" ? "Busy" : "Open") : slot
            )
          : row
      )
    );
  };

  if (!user) {
    return (
      <div className="app login-page">
        <div className="login-card">
          <h1>Schedulr</h1>
          <p className="login-sub">Sign in to continue</p>

          <input placeholder="Email" />
          <input placeholder="Password" type="password" />

          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <main className="app">
      <nav className="navbar">
        <div className="logo">Schedulr</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#preview">Preview</a>
          <a href="#about">About</a>
        </div>
        <button className="nav-button" onClick={handleLogout}>
          Logout
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
          <button>Start Scheduling</button>
          <button className="secondary">See Features</button>
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
            {times.map((time, rowIndex) => (
              <div key={time} className="schedule-row-contents">
                <div className="time">{time}</div>

                {slots[rowIndex].map((slot, colIndex) => (
                  <button
                    key={`${time}-${colIndex}`}
                    className={`slot ${slot.toLowerCase()}`}
                    onClick={() => toggleSlot(rowIndex, colIndex)}
                    type="button"
                  >
                    {slot}
                  </button>
                ))}
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

export default App;
