/**
 * External dependencies
 */
import { get, isUndefined, pickBy } from 'lodash';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { PostsList, withAPIData } from '@wordpress/components';

function PostsSearch( { postsList } ) {
	return ( <PostsList posts={ get( postsList, [ 'data' ], {} ) } /> );
}

export default withAPIData( ( props ) => {
	const postsListQuery = stringify( pickBy( {
		category_id: props.options.categoryId || '',
		search: props.options.term || '',
		order: props.options.order || 'desc',
		orderby: props.options.orderBy || 'date',
		per_page: 10,
		datetime: Date.now(), // make postsList is always updated
	}, ( value ) => ! isUndefined( value ) ) );

	return {
		postsList: `/wp/v2/posts?${ postsListQuery }`,
	};
} )( PostsSearch );
