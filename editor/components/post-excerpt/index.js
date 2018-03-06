/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostExcerpt } from '../../store/selectors';
import { editPost } from '../../store/actions';

function PostExcerpt( { excerpt, onUpdateExcerpt, instanceId } ) {
	const id = `editor-post-excerpt-${ instanceId }`;
	const onChange = ( event ) => onUpdateExcerpt( event.target.value );

	return (
		<div>
			<label key="label" htmlFor={ id }>{ __( 'Write an excerpt (optional)' ) }</label>
			<textarea
				id={ id }
				className="editor-post-excerpt__textarea"
				onChange={ onChange }
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
)( withInstanceId( PostExcerpt ) );
