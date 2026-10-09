import type { FieldsScriptParts } from '@wordpress/fields-loader';

interface PostWithDate {
	date?: string;
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
	setValue: ( { value } ) => ( { date: value } ),
	isVisible: ( item ) => item.status === 'future',
};
