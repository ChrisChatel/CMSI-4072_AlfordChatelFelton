import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import EventPage from "./pages/EventPage";

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Home />} />

      {/* Create Event Page */}
      <Route path="/create" element={<CreateEvent />} />

      {/* Dynamic Event Access Route */}
      <Route path="/event/:eventId" element={<EventPage />} />
    </Routes>
  );
}

export default App;