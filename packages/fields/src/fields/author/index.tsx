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
	getElements: async ( { search, include, perPage } = {} ) => {
		const queryArgs: {
			per_page: number;
			search?: string;
			include?: ( string | number )[];
		} = {
			per_page: perPage ?? 20,
			search: search || undefined,
		};
		if ( include?.length ) {
			queryArgs.include = include;
		}
		const getRecordsArgs = [ 'root', 'user', queryArgs ];
		const [ authors, totalItems, totalPages ]: [
			Author[],
			number | null,
			number | null,
		] = await Promise.all( [
			resolveSelect( coreDataStore ).getEntityRecords(
				...getRecordsArgs
			),
			resolveSelect( coreDataStore ).getEntityRecordsTotalItems(
				...getRecordsArgs
			),
			resolveSelect( coreDataStore ).getEntityRecordsTotalPages(
				...getRecordsArgs
			),
		] );

		return {
			elements: ( authors || [] ).map( ( { id, name } ) => ( {
				value: id,
				label: name,
			} ) ),
			paginationInfo: {
				totalItems: totalItems ?? 0,
				totalPages: totalPages ?? 1,
			},
		};
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
