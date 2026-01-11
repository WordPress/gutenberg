/**
 * Internal dependencies
 */
import type { Settings } from './types';

/**
 * Removes items matched in the regex.
 *
 * @param settings The main settings object containing regular expressions
 * @param text     The string being counted.
 * @return The manipulated text.
 */
export default function stripHTMLEntities(
	settings: Settings,
	text: string
): string {
	return text.replace( settings.HTMLEntityRegExp, '' );
}
