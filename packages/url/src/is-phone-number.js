const PHONE_REGEXP = /^(tel:)?(\+)?\d{6,15}$/;

/**
 * Determines whether the given string looks like a phone number.
 *
 * @param {string} phoneNumber The string to scrutinize.
 *
 * @example
 * ```js
 * const isPhoneNumber = isPhoneNumber('+1 (555) 123-4567'); // true
 * ```
 *
 * @return {boolean} Whether or not it looks like a phone number.
 */
export function isPhoneNumber( phoneNumber ) {
	// Remove any seperator from phone number.
	phoneNumber = phoneNumber.replace( /[-.() ]/g, '' );
	return PHONE_REGEXP.test( phoneNumber );
}
