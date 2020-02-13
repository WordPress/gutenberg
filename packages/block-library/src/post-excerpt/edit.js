/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { PlainText } from '@wordpress/block-editor';

function PostExcerptDisplay() {
	const [ excerpt, setExcerpt ] = useEntityProp(
		'postType',
		'post',
		'excerpt'
	);
	return <PlainText value={ excerpt } onChange={ setExcerpt } />;
}

export default function PostExcerptEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Excerpt Placeholder';
	}
	return <PostExcerptDisplay />;
}
