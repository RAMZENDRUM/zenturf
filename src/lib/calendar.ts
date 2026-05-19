import { createEvent, type EventAttributes } from "ics";

export function downloadICS(args: {
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
}) {
  const [y, m, d] = args.date.split("-").map(Number);
  const [sh, sm] = args.startTime.split(":").map(Number);
  const [eh, em] = args.endTime.split(":").map(Number);

  const event: EventAttributes = {
    title: args.title,
    description: args.description,
    location: args.location,
    start: [y, m, d, sh, sm],
    end: [y, m, d, eh, em],
  };

  createEvent(event, (error, value) => {
    if (error || !value) return;
    const blob = new Blob([value], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${args.title.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
