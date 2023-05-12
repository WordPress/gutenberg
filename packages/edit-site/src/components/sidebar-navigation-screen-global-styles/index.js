/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { edit, seen } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalNavigatorButton as NavigatorButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import StyleVariationsContainer from '../global-styles/style-variations-container';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationItem from '../sidebar-navigation-item';

export function SidebarNavigationItemGlobalStyles( props ) {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const hasGlobalStyleVariations = useSelect(
		( select ) =>
			!! select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations()?.length,
		[]
	);
	if ( hasGlobalStyleVariations ) {
		return (
			<NavigatorButton
				{ ...props }
				as={ SidebarNavigationItem }
				path="/wp_global_styles"
			/>
		);
	}
	return (
		<SidebarNavigationItem
			{ ...props }
			onClick={ () => {
				// switch to edit mode.
				setCanvasMode( 'edit' );
				// open global styles sidebar.
				openGeneralSidebar( 'edit-site/global-styles' );
			} }
		/>
	);
}

export default function SidebarNavigationScreenGlobalStyles() {
	const { openGeneralSidebar } = useDispatch( editSiteStore );
	const { setCanvasMode, setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const [ isStyleBookOpened, setIsStyleBookOpened ] = useState( false );

	// When the style book is opened, switch to the style book view.
	// This is done in a useEffect to ensure that the canvas mode is changed,
	// and the global styles sidebar is opened before attempting to open the style book.
	useEffect( () => {
		if ( isStyleBookOpened ) {
			setEditorCanvasContainerView( 'style-book' );
		}
	}, [ setEditorCanvasContainerView, isStyleBookOpened ] );

	return (
		<SidebarNavigationScreen
			title={ __( 'Styles' ) }
			description={ __(
				'Choose a different style combination for the theme styles.'
			) }
			content={ <StyleVariationsContainer /> }
			actions={
				<div>
					<SidebarButton
						icon={ seen }
						label={ __( 'Style Book' ) }
						onClick={ () => {
							// Switch to edit mode.
							setCanvasMode( 'edit' );
							// Open global styles sidebar.
							openGeneralSidebar( 'edit-site/global-styles' );
							// Open style book, via the useEffect above.
							// This is done via a local state change to ensure that the canvas mode is changed,
							// and the global styles sidebar is opened before attempting to open the style book.
							setIsStyleBookOpened( true );
						} }
					/>
					<SidebarButton
						icon={ edit }
						label={ __( 'Edit styles' ) }
						onClick={ () => {
							// Switch to edit mode.
							setCanvasMode( 'edit' );
							// Open global styles sidebar.
							openGeneralSidebar( 'edit-site/global-styles' );
						} }
					/>
				</div>
			}
		/>
	);
}
