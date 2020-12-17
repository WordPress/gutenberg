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

export const {
	Fill: NavigationPanelPreviewFill,
	Slot: NavigationPanelPreviewSlot,
} = createSlotFill( 'EditSiteNavigationPanelPreview' );

export default function NavigationSidebar() {
	const isNavigationOpen = useSelect( ( select ) => {
		return select( 'core/edit-site' ).isNavigationOpened();
	} );

	return (
		<>
			<NavigationToggle isOpen={ isNavigationOpen } />
			<NavigationPanel isOpen={ isNavigationOpen } />
			<NavigationPanelPreviewSlot />
		</>
	);
}
