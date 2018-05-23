/**
 * External dependencies
 */
import { get, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	PostFooterToggle,
	PostHeaderToggle,
	PostThemeStyleToggle,
	PostTypeSupportCheck,
} from '@wordpress/editor';

/**
 * Module Constants
 */
const PANEL_NAME = 'template-settings-panel';

function TemplateSettingsPanel( { isOpened, onTogglePanel, postType } ) {
	return (
		<PostTypeSupportCheck supportKeys="template-settings">
			<PanelBody
				title={ get( postType, [ 'labels', 'template-settings' ], __( 'Settings' ) ) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PanelRow>
					<PostThemeStyleToggle />
				</PanelRow>

				<PanelRow>
					<PostHeaderToggle />
				</PanelRow>

				<PanelRow>
					<PostFooterToggle />
				</PanelRow>
			</PanelBody>
		</PostTypeSupportCheck>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getPostType } = select( 'core' );
	const { getEditedPostAttribute } = select( 'core/editor' );
	const { isEditorSidebarPanelOpened } = select( 'core/edit-post' );

	return {
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		isOpened: isEditorSidebarPanelOpened( PANEL_NAME ),
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const { toggleGeneralSidebarEditorPanel } = dispatch( 'core/edit-post' );

	return {
		onTogglePanel: partial( toggleGeneralSidebarEditorPanel, PANEL_NAME ),
	};
} );

export default compose( [
	applyWithSelect,
	applyWithDispatch,
] )( TemplateSettingsPanel );
