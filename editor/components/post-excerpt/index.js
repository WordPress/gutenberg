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
import { getEditedPostExcerpt } from '../../selectors';
import { editPost } from '../../actions';

function PostExcerpt( { excerpt, onUpdateExcerpt } ) {
	const onChange = ( event ) => onUpdateExcerpt( event.target.value );
	const excerptTextareaId = 'editor-post-excerpt';

	return (
		<div>
			<label key="label" htmlFor={ excerptTextareaId }>{ __( 'Write an excerpt (optional)' ) }</label>
			<textarea
				className="editor-post-excerpt__textarea"
				onChange={ onChange }
				value={ excerpt }
				aria-label={ __( 'Excerpt' ) }
				id={ excerptTextareaId }
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
