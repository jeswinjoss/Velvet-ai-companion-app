
/**
 * Triggers a haptic feedback vibration on supported devices.
 * @param pattern - Duration in ms or pattern array. Default is 10ms (light tap).
 */
export const triggerHaptic = (pattern: number | number[] = 10) => {
  // Check if navigator.vibrate API is available
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore errors on devices that don't support it or block it
    }
  }
};
