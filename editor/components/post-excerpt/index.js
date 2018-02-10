/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, TextareaControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostExcerpt } from '../../store/selectors';
import { editPost } from '../../store/actions';

function PostExcerpt( { excerpt, onUpdateExcerpt } ) {
	return (
		<div class="editor-post-excerpt">
			<TextareaControl
				label={ __( 'Write an excerpt (optional)' ) }
				className="editor-post-excerpt__textarea"
				onChange={ ( value ) => onUpdateExcerpt( value ) }
				value={ excerpt }
			/>
			<ExternalLink href="https://codex.wordpress.org/Excerpt">
				{ __( 'Learn more about manual excerpts' ) }
			</ExternalLink>
		</div>
	);
}

export default connect(
	( state ) => {
		return {
			excerpt: getEditedPostExcerpt( state ),
		};
	},
	{
		onUpdateExcerpt( excerpt ) {
			return editPost( { excerpt } );
		},
	}
)( PostExcerpt );
