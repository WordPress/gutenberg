/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { BasePostWithEmbeddedAuthor } from '../../types';
import AuthorView from './author-view';

interface Author {
	id: number;
	name: string;
}

const authorField: Field< BasePostWithEmbeddedAuthor > = {
	label: __( 'Author' ),
	id: 'author',
	type: 'integer',
	getElements: async () => {
		const authors: Author[] =
			( await resolveSelect( coreDataStore ).getEntityRecords(
				'root',
				'user',
				{
					per_page: -1,
				}
			) ) ?? [];
		return authors.map( ( { id, name } ) => ( {
			value: id,
			label: name,
		} ) );
	},
	render: AuthorView,
	sort: ( a, b, direction ) => {
		const nameA = a._embedded?.author?.[ 0 ]?.name || '';
		const nameB = b._embedded?.author?.[ 0 ]?.name || '';

		return direction === 'asc'
			? nameA.localeCompare( nameB )
			: nameB.localeCompare( nameA );
	},

	filterBy: {
		operators: [ 'isAny', 'isNone' ],
	},
};

/**
 * Author field for BasePost.
 */
export default authorField;
