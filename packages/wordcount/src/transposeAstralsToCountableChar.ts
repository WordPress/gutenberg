/**
 * Internal dependencies
 */
import type { Settings } from './types';

/**
 * Replaces items matched in the regex with a single character.
 *
 * @param settings The main settings object containing regular expressions
 * @param text     The string being counted.
 * @return The manipulated text.
 */
export default function transposeAstralsToCountableChar(
	settings: Settings,
	text: string
): string {
	return text.replace( settings.astralRegExp, 'a' );
}
