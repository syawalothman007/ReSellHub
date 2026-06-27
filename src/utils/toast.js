/**
 * Toast Notification Utility
 * 
 * Exposes a simple helper function to dispatch custom events to the window object.
 * This allows us to display elegant, non-blocking toast notifications in the UI
 * without cluttering components with local state or loading heavy external libraries.
 */

/**
 * Triggers a global toast notification.
 * @param {string} message - The text content to display.
 * @param {'success' | 'error' | 'info'} [type='success'] - The style category of the toast.
 */
export function showToast(message, type = "success") {
  const event = new CustomEvent("show-toast", {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}
