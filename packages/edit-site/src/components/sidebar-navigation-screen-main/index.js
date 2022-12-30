/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalNavigatorButton as NavigatorButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbolFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';

export default function SidebarNavigationScreenMain() {
	return (
		<SidebarNavigationScreen
			path="/"
			title={ __( 'Design' ) }
			content={
				<ItemGroup>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/templates"
						withChevron
						icon={ layout }
					>
						{ __( 'Templates' ) }
					</NavigatorButton>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/template-parts"
						withChevron
						icon={ symbolFilled }
					>
						{ __( 'Template Parts' ) }
					</NavigatorButton>
				</ItemGroup>
			}
		/>
	);
}
