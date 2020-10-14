/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ContentNavigation from './content-navigation';
import TemplatesNavigation from './templates-navigation';

export const {
	Fill: NavigationPanelPreviewFill,
	Slot: NavigationPanelPreviewSlot,
} = createSlotFill( 'EditSiteNavigationPanelPreview' );

const NavigationPanel = () => {
	return (
		<div className="edit-site-navigation-panel">
			<TemplatesNavigation />
			<ContentNavigation />
			<NavigationPanelPreviewSlot />
		</div>
	);
};

export default NavigationPanel;
