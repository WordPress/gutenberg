import { resolveSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import type { FieldsScriptParts } from '@wordpress/fields-loader';
import AuthorView from './view';
import type { PostWithAuthor } from './types';

interface Author {
	id: number;
	name: string;
}

/**
 * The JavaScript parts of the author field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithAuthor >[ string ] = {
	getElements: async () => {
		const authors: Author[] =
			( await resolveSelect( coreDataStore ).getEntityRecords< Author >(
				'root',
				'user',
				{
					per_page: -1,
					who: 'authors',
					_fields: 'id,name',
					context: 'view',
				}
			) ) ?? [];
		return authors.map( ( { id, name } ) => ( {
			value: id,
			label: name,
		} ) );
	},
	setValue: ( { value } ) => ( { author: Number( value ) } ),
	render: AuthorView,
	// A record without `_links` (a bulk edit form has no record) is
	// treated as allowed, so only an explicit absence of the action hides
	// the control.
	isVisible: ( item ) =>
		! item._links || !! item._links[ 'wp:action-assign-author' ],
};
