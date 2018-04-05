/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { DocumentOutline, DocumentOutlineCheck } from '@wordpress/editor';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Module constants
 */
const PANEL_NAME = 'table-of-contents';

function DocumentOutlinePanel( { isOpened, onTogglePanel } ) {
	return (
		<DocumentOutlineCheck>
			<PanelBody title={ __( 'Table of Contents' ) } opened={ isOpened } onToggle={ onTogglePanel }>
				<DocumentOutline />
			</PanelBody>
		</DocumentOutlineCheck>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			isOpened: select( 'core/edit-post' ).isEditorSidebarPanelOpened( PANEL_NAME ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onTogglePanel() {
			return dispatch( 'core/edit-post' ).toggleGeneralSidebarEditorPanel( PANEL_NAME );
		},
	} ) ),
] )( DocumentOutlinePanel );
