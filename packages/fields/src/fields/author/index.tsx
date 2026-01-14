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
	getElements: async ( { search, include, perPage, page = 1 } = {} ) => {
		const queryArgs: {
			per_page: number;
			search?: string;
			include?: ( string | number )[];
			page?: number;
		} = {
			per_page: perPage ?? 2,
			search: search || undefined,
			page,
		};
		if ( include?.length ) {
			queryArgs.include = include;
		}
		const [ authors, totalPages ] = await Promise.all( [
			resolveSelect( coreDataStore ).getEntityRecords< Author >(
				'root',
				'user',
				queryArgs
			),
			resolveSelect( coreDataStore ).getEntityRecordsTotalPages(
				'root',
				'user',
				queryArgs
			),
		] );

		return {
			elements: ( authors || [] ).map( ( { id, name } ) => ( {
				value: id,
				label: name,
			} ) ),
			paginationInfo: {
				totalPages: totalPages ?? 1,
			},
		};
	},
	getTotalAvailableElementsCount: async () =>
		resolveSelect( coreDataStore ).getEntityRecordsTotalItems(
			'root',
			'user',
			{
				per_page: 1,
				_fields: 'id',
			}
		),
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
