/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { PanelBody } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostExcerpt } from '../../selectors';
import { editPost } from '../../actions';

function PostExcerpt( { excerpt, onUpdateExcerpt } ) {
	const onChange = ( event ) => onUpdateExcerpt( event.target.value );

	return (
		<PanelBody title={ __( 'Excerpt' ) } initialOpen={ false }>
			<textarea
				className="editor-post-excerpt__textarea"
				onChange={ onChange }
				value={ excerpt }
				placeholder={ __( 'Write an excerpt (optional)' ) }
				aria-label={ __( 'Excerpt' ) }
			/>
			<a href="https://codex.wordpress.org/Excerpt" target="_blank">
				{ __( 'Learn more about manual excerpts' ) }
			</a>
		</PanelBody>
	);
}

export default connect(
	( state ) => {
		return {
			excerpt: getEditedPostExcerpt( state ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateExcerpt( excerpt ) {
				dispatch( editPost( { excerpt } ) );
			},
		};
	}
)( PostExcerpt );

