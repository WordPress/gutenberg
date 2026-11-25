import { resolveSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import type { FieldsScriptParts } from '../../types';
import AuthorEdit from './edit';
import AuthorView from './view';
import { AUTHORS_QUERY, type Author } from './authors-query';
import type { PostWithAuthor } from './types';

/**
 * The JavaScript parts of the author field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithAuthor >[ string ] = {
	getElements: async () => {
		const authors: Author[] =
			( await resolveSelect( coreDataStore ).getEntityRecords< Author >(
				'root',
				'user',
				AUTHORS_QUERY
			) ) ?? [];
		return authors.map( ( { id, name } ) => ( {
			value: id,
			label: name,
		} ) );
	},
	setValue: ( { value } ) => ( { author: Number( value ) } ),
	Edit: AuthorEdit,
	render: AuthorView,
	// A record without `_links` (a bulk edit form has no record) is
	// treated as allowed, so only an explicit absence of the action hides
	// the control.
	isVisible: ( item ) =>
		! item._links || !! item._links[ 'wp:action-assign-author' ],
};
