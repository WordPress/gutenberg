/**
 * Internal dependencies
 */
import type { Settings } from './types';

/**
 * Replaces items matched in the regex with spaces.
 *
 * @param settings The main settings object containing regular expressions
 * @param text     The string being counted.
 * @return The manipulated text.
 */
export default function stripRemovables(
	settings: Settings,
	text: string
): string {
	return text.replace( settings.removeRegExp, '' );
}
