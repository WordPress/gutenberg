/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, TextareaControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostExcerptMinimal( { excerpt, onChange } ) {
	return (
		<RichText
			aria-label={ __( 'Post excerpt text' ) }
			placeholder={ __( 'Add excerpt' ) }
			value={ excerpt }
			onChange={ onChange }
			tagName="p"
		/>
	);
}

function PostExcerptVerbose( { excerpt, onChange } ) {
	return (
		<>
			<TextareaControl
				label={ __( 'Write an excerpt (optional)' ) }
				className="editor-post-excerpt__textarea"
				onChange={ onChange }
				value={ excerpt }
			/>
			<ExternalLink
				href={ __(
					'https://wordpress.org/support/article/settings-sidebar/#excerpt'
				) }
			>
				{ __( 'Learn more about manual excerpts' ) }
			</ExternalLink>
		</>
	);
}

export default function PostExcerpt( { isMinimal } ) {
	const { editPost } = useDispatch( editorStore );
	const excerpt = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'excerpt' ),
		[]
	);
	const Component = isMinimal ? PostExcerptMinimal : PostExcerptVerbose;
	return (
		<div className="editor-post-excerpt">
			<Component
				excerpt={ excerpt }
				onChange={ ( newExcerpt ) =>
					editPost( { excerpt: newExcerpt } )
				}
			/>
		</div>
	);
}
