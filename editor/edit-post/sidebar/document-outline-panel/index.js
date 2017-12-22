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
 * Internal dependencies
 */
import { DocumentOutline, DocumentOutlineCheck } from '../../../components';
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleSidebarPanel } from '../../../store/actions';

/**
 * Module constants
 */
const PANEL_NAME = 'table-of-contents';

function DocumentOutlinePanel( { isOpened, onTogglePanel } ) {
	return (
		<DocumentOutlineCheck>
			<PanelBody title={ __( 'Document Outline' ) } opened={ isOpened } onToggle={ onTogglePanel }>
				<DocumentOutline />
			</PanelBody>
		</DocumentOutlineCheck>
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
)( DocumentOutlinePanel );
