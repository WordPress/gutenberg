/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostExcerpt() {
	const excerpt = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'excerpt' ),
		[]
	);
	const { editPost } = useDispatch( editorStore );

	return (
		<div className="editor-post-excerpt">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Write an excerpt (optional)' ) }
				className="editor-post-excerpt__textarea"
				onChange={ ( value ) => editPost( { excerpt: value } ) }
				value={ excerpt }
			/>
			<ExternalLink
				href={ __(
					'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt'
				) }
			>
				{ __( 'Learn more about manual excerpts' ) }
			</ExternalLink>
		</div>
	);
}

export default PostExcerpt;
