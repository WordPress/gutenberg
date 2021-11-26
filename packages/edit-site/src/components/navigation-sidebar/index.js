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

export default function NavigationSidebar( {
	isDefaultOpen = false,
	activeTemplateType,
} ) {
	const isDesktopViewport = useViewportMatch( 'medium' );
	const { setIsNavigationPanelOpened } = useDispatch( editSiteStore );

	useEffect( () => {
		// When transitioning to desktop open the navigation if `isDefaultOpen` is true.
		if ( isDefaultOpen && isDesktopViewport ) {
			setIsNavigationPanelOpened( true );
		}

		// When transitioning to mobile/tablet, close the navigation.
		if ( ! isDesktopViewport ) {
			setIsNavigationPanelOpened( false );
		}
	}, [ isDefaultOpen, isDesktopViewport, setIsNavigationPanelOpened ] );

	return (
		<>
			<NavigationToggle />
			<NavigationPanel activeItem={ activeTemplateType } />
			<NavigationPanelPreviewSlot />
		</>
	);
}
