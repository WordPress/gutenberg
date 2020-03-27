/**
 * Retrieve the translation of text.
 *
 * @see https://developer.wordpress.org/reference/functions/__/
 *
 * @param {string} text     Text to translate.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} Translated text.
 */
export function __( text, domain ) {
	return text + domain;
}
