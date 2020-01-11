/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { RichText } from '@wordpress/block-editor';

function PostAuthorDisplay() {
	const [ author ] = useEntityProp( 'postType', 'post', 'author' );
	return <RichText.Content tagName="h6" value={ String( author ) } />;
}

export default function PostAuthorEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Author Placeholder';
	}
	return <PostAuthorDisplay />;
}
