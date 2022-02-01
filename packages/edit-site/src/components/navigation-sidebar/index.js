/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { createSlotFill } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import NavigationPanel from './navigation-panel';
import NavigationToggle from './navigation-toggle';

export const {
	Fill: NavigationPanelPreviewFill,
	Slot: NavigationPanelPreviewSlot,
} = createSlotFill( 'EditSiteNavigationPanelPreview' );

const {
	Fill: NavigationSidebarFill,
	Slot: NavigationSidebarSlot,
} = createSlotFill( 'EditSiteNavigationSidebar' );

function NavigationSidebar( { isDefaultOpen = false, activeTemplateType } ) {
	const isDesktopViewport = useViewportMatch( 'medium' );
	const { setIsNavigationPanelOpened } = useDispatch( editSiteStore );

	useEffect(
		function autoOpenNavigationPanelOnViewportChange() {
			setIsNavigationPanelOpened( isDefaultOpen && isDesktopViewport );
		},
		[ isDefaultOpen, isDesktopViewport, setIsNavigationPanelOpened ]
	);

	return (
		<NavigationSidebarFill>
			<NavigationToggle />
			<NavigationPanel activeItem={ activeTemplateType } />
			<NavigationPanelPreviewSlot />
		</NavigationSidebarFill>
	);
}

NavigationSidebar.Slot = NavigationSidebarSlot;

export default NavigationSidebar;
