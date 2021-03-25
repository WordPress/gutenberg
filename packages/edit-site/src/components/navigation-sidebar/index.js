/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import NavigationPanel from './navigation-panel';
import NavigationToggle from './navigation-toggle';
import { store as editSiteStore } from '../../store';

export const {
	Fill: NavigationPanelPreviewFill,
	Slot: NavigationPanelPreviewSlot,
} = createSlotFill( 'EditSiteNavigationPanelPreview' );

export default function NavigationSidebar() {
	const isNavigationOpen = useSelect( ( select ) => {
		return select( editSiteStore ).isNavigationOpened();
	} );

	return (
		<>
			<NavigationToggle isOpen={ isNavigationOpen } />
			<NavigationPanel isOpen={ isNavigationOpen } />
			<NavigationPanelPreviewSlot />
		</>
	);
}
