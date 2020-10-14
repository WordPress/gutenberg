/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ContentNavigation from './content-navigation';
import TemplatesNavigation from './templates-navigation';
import { useSelect } from '@wordpress/data';
import { MENU_ROOT } from './constants';

export const {
	Fill: NavigationPanelPreviewFill,
	Slot: NavigationPanelPreviewSlot,
} = createSlotFill( 'EditSiteNavigationPanelPreview' );

const NavigationPanel = () => {
	const [ contentActiveMenu, setContentActiveMenu ] = useState( MENU_ROOT );
	const templatesActiveMenu = useSelect(
		( select ) => select( 'core/edit-site' ).getNavigationPanelActiveMenu(),
		[]
	);

	return (
		<div className="edit-site-navigation-panel">
			{ ( contentActiveMenu === MENU_ROOT ||
				templatesActiveMenu !== MENU_ROOT ) && <TemplatesNavigation /> }

			{ ( templatesActiveMenu === MENU_ROOT ||
				contentActiveMenu !== MENU_ROOT ) && (
				<ContentNavigation onActivateMenu={ setContentActiveMenu } />
			) }

			<NavigationPanelPreviewSlot />
		</div>
	);
};

export default NavigationPanel;
