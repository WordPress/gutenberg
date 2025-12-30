/**
 * Internal dependencies
 */
import type { Settings } from './types';

/**
 * Replaces items matched in the regex with new line
 *
 * @param settings The main settings object containing regular expressions
 * @param text     The string being counted.
 * @return The manipulated text.
 */
export default function stripTags( settings: Settings, text: string ): string {
	return text.replace( settings.HTMLRegExp, '\n' );
}
