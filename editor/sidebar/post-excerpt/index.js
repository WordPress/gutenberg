/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostExcerpt, isEditorSidebarPanelOpened } from '../../selectors';
import { editPost, toggleSidebarPanel } from '../../actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-excerpt';

function PostExcerpt( { excerpt, onUpdateExcerpt, isOpened, onTogglePanel } ) {
	const onChange = ( event ) => onUpdateExcerpt( event.target.value );

	return (
		<PanelBody title={ __( 'Excerpt' ) } opened={ isOpened } onToggle={ onTogglePanel }>
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
		</PanelBody>
	);
}

export default connect(
	( state ) => {
		return {
			excerpt: getEditedPostExcerpt( state ),
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onUpdateExcerpt( excerpt ) {
			return editPost( { excerpt } );
		},
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	}
)( PostExcerpt );

