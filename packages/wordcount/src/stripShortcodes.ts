/**
 * Internal dependencies
 */
import type { Settings } from './types';

/**
 * Replaces items matched in the regex with a new line.
 *
 * @param settings The main settings object containing regular expressions
 * @param text     The string being counted.
 * @return The manipulated text.
 */
export default function stripShortcodes(
	settings: Settings,
	text: string
): string {
	if ( settings.shortcodesRegExp ) {
		return text.replace( settings.shortcodesRegExp, '\n' );
	}
	return text;
}
