import { getActiveFormats } from './get-active-formats';
import type { RichTextValue } from './types';

/**
 * Gets the format object by type at the start of the selection. This can be
 * used to get e.g. the URL of a link format at the current selection, but also
 * to check if a format is active at the selection. Returns undefined if there
 * is no format at the selection.
 *
 * @param value      Value to inspect.
 * @param formatType Format type to look for.
 *
 * @return Active format object of the specified
 *                                    type, or undefined.
 */
export function getActiveFormat( value: RichTextValue, formatType: string ) {
	return getActiveFormats( value ).find(
		( { type } ) => type === formatType
	);
}
