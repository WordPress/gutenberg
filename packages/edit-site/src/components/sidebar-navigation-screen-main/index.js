/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbol, navigation, styles, page } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';

import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { SidebarNavigationItemGlobalStyles } from '../sidebar-navigation-screen-global-styles';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

export default function SidebarNavigationScreenMain() {
	const { location } = useNavigator();
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	// Clear the editor canvas container view when accessing the main navigation screen.
	useEffect( () => {
		if ( location?.path === '/' ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ setEditorCanvasContainerView, location?.path ] );

	return (
		<SidebarNavigationScreen
			isRoot
			title={ __( 'Design' ) }
			description={ __(
				'Customize the appearance of your website using the block editor.'
			) }
			content={
				<ItemGroup>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/navigation"
						withChevron
						icon={ navigation }
					>
						{ __( 'Navigation' ) }
					</NavigatorButton>
					<SidebarNavigationItemGlobalStyles
						withChevron
						icon={ styles }
					>
						{ __( 'Styles' ) }
					</SidebarNavigationItemGlobalStyles>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/page"
						withChevron
						icon={ page }
					>
						{ __( 'Pages' ) }
					</NavigatorButton>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/wp_template"
						withChevron
						icon={ layout }
					>
						{ __( 'Templates' ) }
					</NavigatorButton>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/patterns"
						withChevron
						icon={ symbol }
					>
						{ __( 'Patterns' ) }
					</NavigatorButton>
				</ItemGroup>
			}
		/>
	);
}
