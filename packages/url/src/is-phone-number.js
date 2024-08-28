const PHONE_REGEXP =
	/^(\+?\d{1,3}[- ]?)?\(?(?:\d{2,3})\)?[- ]?\d{3,4}[- ]?\d{4}$/;

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
	return PHONE_REGEXP.test( phoneNumber );
}
