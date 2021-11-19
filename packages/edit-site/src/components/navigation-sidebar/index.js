/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import NavigationPanel from './navigation-panel';
import NavigationToggle from './navigation-toggle';

export const {
	Fill: NavigationPanelPreviewFill,
	Slot: NavigationPanelPreviewSlot,
} = createSlotFill( 'EditSiteNavigationPanelPreview' );

export default function NavigationSidebar( {
	defaultIsOpen = false,
	activeTemplateType,
} ) {
	const [ isNavigationOpen, setIsNavigationOpen ] = useState( defaultIsOpen );

	return (
		<>
			<NavigationToggle
				isOpen={ isNavigationOpen }
				setIsOpen={ setIsNavigationOpen }
			/>
			<NavigationPanel
				isOpen={ isNavigationOpen }
				setIsOpen={ setIsNavigationOpen }
				activeTemplateType={ activeTemplateType }
			/>
			<NavigationPanelPreviewSlot />
		</>
	);
}
