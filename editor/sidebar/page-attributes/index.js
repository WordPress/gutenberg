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
import PageAttributesCheck from '../../page-attributes/check';
import PageAttributesForm from '../../page-attributes';
import { toggleSidebarPanel } from '../../actions';
import { isEditorSidebarPanelOpened } from '../../selectors';

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
				<PanelRow>
					<PageAttributesForm />
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
