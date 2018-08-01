/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, TextareaControl } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { applyFilters } from '@wordpress/hooks';

function PostExcerpt( { excerpt, onUpdateExcerpt } ) {
	return (
		<div className="editor-post-excerpt">
			<TextareaControl
				label={ PostExcerptLabel( __( 'Write an excerpt (optional)' ) ) }
				className="editor-post-excerpt__textarea"
				onChange={ ( value ) => onUpdateExcerpt( value ) }
				value={ excerpt }
			/>
			<ExternalLink href="https://codex.wordpress.org/Excerpt">
				{ PostExcerptLinkText( __( 'Learn more about manual excerpts' ) ) }
			</ExternalLink>
		</div>
	);
}

/**
 * Wrapper function to filter the label property passed to the post excerpt Textareacontrol.
 *
 * @param {string} label The default label to be filtered.
 * @return {string} The filtered string.
 */
function PostExcerptLabel( label ) {
	return applyFilters( 'editor.post-excerpt.label', label );
}

/**
 * Wrapper function to filter the internal text of the codex link in the post excerpt.
 *
 * @param {string} text The default text to be filtered.
 * @return {string} The filtered string.
 */
function PostExcerptLinkText( text ) {
	return applyFilters( 'editor.post-excerpt.link-text', text );
}

export default compose( [
	withSelect( ( select ) => {
		return {
			excerpt: select( 'core/editor' ).getEditedPostAttribute( 'excerpt' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateExcerpt( excerpt ) {
			dispatch( 'core/editor' ).editPost( { excerpt } );
		},
	} ) ),
] )( PostExcerpt );
