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
		const query = {
			per_page: -1,
			_fields: 'id,name',
			context: 'view',
		};
		const [ capableAuthors, publishedAuthors ] = await Promise.all( [
			resolveSelect( coreDataStore ).getEntityRecords( 'root', 'user', {
				...query,
				who: 'authors',
			} ),
			resolveSelect( coreDataStore ).getEntityRecords( 'root', 'user', {
				...query,
				has_published_posts: true,
			} ),
		] );
		const authorsMap = new Map< number, Author >();
		for ( const author of [
			...( ( capableAuthors ?? [] ) as Author[] ),
			...( ( publishedAuthors ?? [] ) as Author[] ),
		] ) {
			authorsMap.set( author.id, author );
		}
		return Array.from( authorsMap.values() ).map( ( { id, name } ) => ( {
			value: id,
			label: name,
		} ) );
	},
	setValue: ( { value } ) => ( { author: Number( value ) } ),
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
