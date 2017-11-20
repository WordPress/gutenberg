/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { DocumentOutline } from '../../components';
import { getBlocks, isEditorSidebarPanelOpened } from '../../state/selectors';
import { toggleSidebarPanel } from '../../state/actions';

/**
 * Module constants
 */
const PANEL_NAME = 'table-of-contents';

const DocumentOutlinePanel = ( { blocks, isOpened, onTogglePanel } ) => {
	const headings = filter( blocks, ( block ) => block.name === 'core/heading' );

	if ( headings.length <= 1 ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Document Outline' ) } opened={ isOpened } onToggle={ onTogglePanel }>
			<DocumentOutline />
		</PanelBody>
	);
};

export default connect(
	( state ) => {
		return {
			blocks: getBlocks( state ),
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	}
)( DocumentOutlinePanel );
