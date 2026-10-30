import type { FieldsScriptParts } from '../../types';

interface PostWithDate {
	date?: string | null;
	status?: string;
}

/**
 * The JavaScript parts of the scheduled date field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithDate >[ string ] = {
	// The scheduled date is the date of the post, shown for scheduled posts
	// only.
	getValue: ( { item } ) => item.date,
	// A cleared control gives `undefined`, which a save drops, so send `null`:
	// the REST API resets the date on `null`.
	setValue: ( { value } ) => ( { date: value ?? null } ),
	isVisible: ( item ) => item.status === 'future',
};
