/**
 * Removes items matched in the regex.
 *
 * @param {import("./index").WordCountSettings} settings The main settings object containing regular expressions
 * @param {string} text     The string being counted.
 *
 * @return {string} The manipulated text.
 */
export default function stripHTMLComments( settings, text ) {
	if ( settings.HTMLcommentRegExp ) {
		return text.replace( settings.HTMLcommentRegExp, '' );
	}
	return text;
}
