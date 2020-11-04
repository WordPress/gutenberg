/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

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

	// Don't mount navigation panel until it is triggered.
	// This prevents bugs as noted in #26613.
	// We can revert this once the underlying bugs are fixed.
	const [ hasOpened, setHasOpened ] = useState( false );
	return (
		<>
			<NavigationToggle
				isOpen={ isNavigationOpen }
				setHasOpened={ setHasOpened }
			/>
			{ hasOpened && (
				<>
					<NavigationPanel isOpen={ isNavigationOpen } />
					<NavigationPanelPreviewSlot />
				</>
			) }
		</>
	);
}
