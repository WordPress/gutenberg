/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostExcerpt2() {
	const { editPost } = useDispatch( editorStore );
	const excerpt = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'excerpt' ),
		[]
	);
	return (
		<div className="editor-post-excerpt">
			<RichText
				className=""
				aria-label={ __( 'Post excerpt text' ) }
				placeholder={ __( 'Add excerpt' ) }
				value={ excerpt }
				onChange={ ( newExcerpt ) =>
					editPost( { excerpt: newExcerpt } )
				}
				tagName="p"
			/>
			<ExternalLink
				href={ __(
					'https://wordpress.org/support/article/settings-sidebar/#excerpt'
				) }
			>
				{ __( 'Learn more about manual excerpts' ) }
			</ExternalLink>
		</div>
	);
}

export default PostExcerpt2;
