/**
 * Replaces items matched in the regex with character.
 *
 * @param {import('./index').WPWordCountSettings} settings The main settings object containing regular expressions
 * @param {string} text     The string being counted.
 *
 * @return {string} The manipulated text.
 */
export default function transposeAstralsToCountableChar( settings, text ) {
	if ( settings.astralRegExp ) {
		return text.replace( settings.astralRegExp, 'a' );
	}
	return text;
}
