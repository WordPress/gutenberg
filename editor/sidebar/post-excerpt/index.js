/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { PostExcerpt as PostExcerptForm } from '../../components';
import { isEditorSidebarPanelOpened } from '../../state/selectors';
import { toggleSidebarPanel } from '../../state/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-excerpt';

function PostExcerpt( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody title={ __( 'Excerpt' ) } opened={ isOpened } onToggle={ onTogglePanel }>
			<PostExcerptForm />
		</PanelBody>
	);
}

export default connect(
	( state ) => {
		return {
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	}
)( PostExcerpt );

