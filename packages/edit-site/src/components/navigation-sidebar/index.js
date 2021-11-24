/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { createSlotFill } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';

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
	isDefaultOpen = false,
	activeTemplateType,
} ) {
	const isDesktopViewport = useViewportMatch( 'medium' );
	const [ isNavigationOpen, setIsNavigationOpen ] = useState(
		isDefaultOpen && isDesktopViewport
	);

	useEffect( () => {
		// When transitioning to desktop open the navigation if `isDefaultOpen` is true.
		if ( isDefaultOpen && isDesktopViewport ) {
			setIsNavigationOpen( true );
		}

		// When transitioning to mobile/tablet, close the navigation.
		if ( ! isDesktopViewport ) {
			setIsNavigationOpen( false );
		}
	}, [ isDefaultOpen, isDesktopViewport ] );

	return (
		<>
			<NavigationToggle
				isOpen={ isNavigationOpen }
				setIsOpen={ setIsNavigationOpen }
			/>
			<NavigationPanel
				isOpen={ isNavigationOpen }
				setIsOpen={ setIsNavigationOpen }
				activeItem={ activeTemplateType }
			/>
			<NavigationPanelPreviewSlot />
		</>
	);
}
