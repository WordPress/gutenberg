/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePostWithEmbeddedAuthor } from '../../types';
import AuthorView from './author-view';

const authorField: Field< BasePostWithEmbeddedAuthor > = {
	label: __( 'Author' ),
	id: 'author',
	type: 'integer',
	elements: [],
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
