/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { RichText } from '@wordpress/block-editor';

function PostExcerptDisplay() {
	const [ excerpt ] = useEntityProp( 'postType', 'post', 'excerpt' );
	return <RichText.Content tagName="p" value={ excerpt } />;
}

export default function PostExcerptEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Excerpt Placeholder';
	}
	return <PostExcerptDisplay />;
}
