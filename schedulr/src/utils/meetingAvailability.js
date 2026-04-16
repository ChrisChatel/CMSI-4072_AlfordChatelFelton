/**
 * Finds the top 3 windows with the highest participant count.
 * @param {Array} availabilityWindows - [[[start, end], [start, end]], [[start, end]]]
 */
function FindMeetingTimes(availabilityWindows) {
  const events = [];

  // Helper to convert 1330 to 810 minutes for accurate duration math
  const toMins = (t) => Math.floor(t / 100) * 60 + (t % 100);

  // 1. Flatten into "Events"
  availabilityWindows.forEach((personSchedule) => {
    personSchedule.forEach(([start, end]) => {
      events.push({ time: start, type: 1 });  // Entry
      events.push({ time: end, type: -1 }); // Exit
    });
  });

  // 2. Sort by time. If times are equal, process starts (+1) before ends (-1)
  events.sort((a, b) => a.time - b.time || b.type - a.type);

  const windows = [];
  let currentPeople = 0;
  let lastTime = null;

  // 3. Sweep through the timeline
  for (const event of events) {
    if (lastTime !== null && event.time > lastTime) {
      const duration = toMins(event.time) - toMins(lastTime);
      
      windows.push({
        start: lastTime,
        end: event.time,
        count: currentPeople,
        durationInMinutes: duration
      });
    }

    currentPeople += event.type;
    lastTime = event.time;
  }

  // 4. Sort by highest count, then by longest duration, and return top 3
  return windows
    .filter(w => w.count > 0)
    .sort((a, b) => b.count - a.count || b.durationInMinutes - a.durationInMinutes)
    .slice(0, 3);
}

// Example Test:
const data = [
  [[900, 1100], [1300, 1500]], 
  [[1000, 1200], [1400, 1600]], 
  [[1030, 1430]]
];

console.log(FindMeetingTimes(data));