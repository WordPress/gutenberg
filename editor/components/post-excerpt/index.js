/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostExcerpt } from '../../state/selectors';
import { editPost } from '../../state/actions';

function PostExcerpt( { excerpt, onUpdateExcerpt } ) {
	const onChange = ( event ) => onUpdateExcerpt( event.target.value );

	return (
		<div>
			<textarea
				className="editor-post-excerpt__textarea"
				onChange={ onChange }
				value={ excerpt }
				placeholder={ __( 'Write an excerpt (optional)' ) }
				aria-label={ __( 'Excerpt' ) }
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

