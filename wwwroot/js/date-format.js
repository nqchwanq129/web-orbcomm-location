export function formatDate(utcDate) {
  if (!utcDate) {
    return "Chưa có";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(utcDate));
}
