/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
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
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	return (
		<SidebarNavigationScreen
			title={ __( 'Styles' ) }
			description={ __(
				'Choose a different style combination for the theme styles.'
			) }
			content={ <StyleVariationsContainer /> }
			actions={
				<SidebarButton
					icon={ edit }
					label={ __( 'Edit styles' ) }
					onClick={ () => {
						// switch to edit mode.
						setCanvasMode( 'edit' );
						// open global styles sidebar.
						openGeneralSidebar( 'edit-site/global-styles' );
					} }
				/>
			}
		/>
	);
}
