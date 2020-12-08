/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import NavigationPanel from './navigation-panel';

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
			<NavigationPanel isOpen={ isNavigationOpen } />
			<NavigationPanelPreviewSlot />
		</>
	);
}
