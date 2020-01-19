/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function PostTitleInput( { postType, postId } ) {
	const [ title, setTitle ] = useEntityProp(
		'postType',
		postType,
		'title',
		postId
	);
	return (
		<RichText
			tagName="h2"
			placeholder={ __( 'Post Title' ) }
			value={ title }
			onChange={ setTitle }
			allowedFormats={ [] }
		/>
	);
}

export default function PostTitleEdit( { context: { postType, postId } } ) {
	if ( ! postType || ! postId ) {
		return 'Post Title Placeholder';
	}

	return <PostTitleInput postType={ postType } postId={ postId } />;
}
