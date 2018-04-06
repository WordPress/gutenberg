/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	PostFooter,
	PostHeader,
	PostThemeStyle,
} from '@wordpress/editor';

/**
 * Module Constants
 */
const PANEL_NAME = 'settings-panel';

function SettingsPanel( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody
			title={ __( 'Settings' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<PanelRow>
				<PostThemeStyle />
			</PanelRow>

			<PanelRow>
				<PostHeader />
			</PanelRow>

			<PanelRow>
				<PostFooter />
			</PanelRow>
		</PanelBody>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		isOpened: select( 'core/edit-post' ).isEditorSidebarPanelOpened( PANEL_NAME ),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onTogglePanel() {
			return dispatch( 'core/edit-post' ).toggleGeneralSidebarEditorPanel( PANEL_NAME );
		},
	} ) ),
] )( SettingsPanel );
