/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PageAttributesCheck, PageAttributesOrder, PageAttributesParent } from '../../../components';
import { toggleSidebarPanel } from '../../../store/actions';
import { isEditorSidebarPanelOpened } from '../../../store/selectors';

/**
 * Module Constants
 */
const PANEL_NAME = 'page-attributes';

export function PageAttributes( { isOpened, onTogglePanel } ) {
	return (
		<PageAttributesCheck>
			<PanelBody
				title={ __( 'Page Attributes' ) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PageAttributesParent />
				<PanelRow>
					<PageAttributesOrder />
				</PanelRow>
			</PanelBody>
		</PageAttributesCheck>
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
)( PageAttributes );
