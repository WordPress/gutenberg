import type { FieldsScriptParts } from '@wordpress/fields-loader';

interface PostsPage {
	title?: string | { raw?: string };
}

/**
 * The JavaScript parts of the Posts Page title field; the editor summary form
 * maps it to the Posts Page entity.
 */
export const fieldExtensions: FieldsScriptParts< PostsPage >[ string ] = {
	getValue: ( { item } ) => {
		const title = item.title;
		if ( typeof title === 'string' ) {
			return title;
		}
		return title?.raw ?? '';
	},
	setValue: ( { value } ) => ( { title: value } ),
};
