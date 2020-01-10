/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function PostTitleInput() {
	const [ title, setTitle ] = useEntityProp( 'postType', 'post', 'title' );
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

export default function PostTitleEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Title Placeholder';
	}

	return <PostTitleInput />;
}
