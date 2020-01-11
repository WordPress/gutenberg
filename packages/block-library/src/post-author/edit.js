/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';

function PostAuthorDisplay() {
	const [ author ] = useEntityProp( 'postType', 'post', 'author' );
	return <address>{ author }</address>;
}

export default function PostAuthorEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Author Placeholder';
	}
	return <PostAuthorDisplay />;
}
