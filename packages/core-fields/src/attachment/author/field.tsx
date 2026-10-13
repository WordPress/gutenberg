import { resolveSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import type { FieldsScriptParts } from '@wordpress/fields-loader';
import type { MediaItem } from '../types';
import AuthorView from './view';

interface Author {
	id: number;
	name: string;
}

/**
 * The JavaScript parts of the media author field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
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
	render: AuthorView,
};
