export const STEP = 0.1;
/**
 * There are varying value types within LineHeightControl:
 *
 * {undefined} Initial value. No changes from the user.
 * {string} Input value. Value consumed/outputted by the input. Empty would be ''.
 * {number} Block attribute type. Input value needs to be converted for attribute setting.
 *
 * Note: If the value is undefined, the input requires it to be an empty string ('')
 * in order to be considered "controlled" by props (rather than internal state).
 */
export const RESET_VALUE = '';
