export default function formatPostTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const time = date
    .toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  // Normalize dates (ignore time)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const postDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((today - postDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${time}`;
  }

  if (diffDays === 1) {
    return `Yesterday, ${time}`;
  }

  return `${date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })}, ${time}`;
}
