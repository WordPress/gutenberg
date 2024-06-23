/**
 * Internal dependencies
 */
import type { RichTextFormatFull, RichTextFormatList } from '../types';

/**
 * Returns an action object used in signalling that format types have been
 * added.
 * Ignored from documentation as registerFormatType should be used instead from @wordpress/rich-text
 *
 * @ignore
 *
 * @param formatTypes Format types received.
 *
 * @return Action object.
 */
export function addFormatTypes(
	formatTypes: RichTextFormatFull | RichTextFormatList
) {
	return {
		type: 'ADD_FORMAT_TYPES' as const,
		formatTypes: Array.isArray( formatTypes )
			? formatTypes
			: [ formatTypes ],
	};
}
export type AddFormatTypesAction = ReturnType< typeof addFormatTypes >;

/**
 * Returns an action object used to remove a registered format type.
 *
 * Ignored from documentation as unregisterFormatType should be used instead from @wordpress/rich-text
 *
 * @ignore
 *
 * @param names Format name.
 *
 * @return Action object.
 */
export function removeFormatTypes( names: string | string[] ) {
	return {
		type: 'REMOVE_FORMAT_TYPES' as const,
		names: Array.isArray( names ) ? names : [ names ],
	};
}
export type RemoveFormatTypesAction = ReturnType< typeof removeFormatTypes >;
