/**
 * Platform-specific modifier for the access key chord.
 *
 * @see pressWithModifier
 *
 * @type {string}
 */
export const ACCESS_MODIFIER_KEYS =
  process.platform === 'darwin' ? [ 'Control', 'Alt' ] : [ 'Shift', 'Alt' ];
