export function showToast(message, type = "success") {
  window.dispatchEvent(
    new CustomEvent("mealmind-toast", {
      detail: {
        id: crypto.randomUUID(),
        message,
        type,
      },
    })
  );
}