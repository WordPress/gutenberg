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
	return ( <PostsList posts={ get( postsList, 'data', {} ) } /> );
}

export default withAPIData( ( props ) => {
	const options = {
		category_id: props.options.categoryId || '',
		s: props.options.term || '',
		type: 'post',
		order: props.options.order || 'desc',
		orderBy: props.options.orderBy || 'date',
		per_page: 10,
	};

	const postsListQuery = stringify( pickBy( options, ( value ) => ! isUndefined( value ) ) );

	return {
		postsList: `/wp/v2/posts?${ postsListQuery }`,
	};
} )( PostsSearch );
