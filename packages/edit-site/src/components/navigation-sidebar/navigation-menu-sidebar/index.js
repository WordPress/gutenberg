/**
 * WordPress dependencies
 */
import { FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigation } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DefaultSidebar from '../../sidebar/default-sidebar';
import NavigationInspector from './navigation-inspector';

export default function NavigationMenuSidebar() {
	return (
		<DefaultSidebar
			className="edit-site-navigation-menu-sidebar"
<<<<<<< HEAD:packages/edit-site/src/components/sidebar/navigation-menu-sidebar/index.js
			identifier="edit-site/navigation-menu"
			title={ __( 'Navigation Menus' ) }
=======
			scope="core/edit-global"
			identifier="edit-global/navigation-menu"
			title={ __( 'Navigation' ) }
>>>>>>> 0231f0b300 (Navigation Sidebar: experiment with a persistent vertical display):packages/edit-site/src/components/navigation-sidebar/navigation-menu-sidebar/index.js
			icon={ navigation }
			closeLabel={ __( 'Close navigation menu sidebar' ) }
			panelClassName="edit-site-navigation-menu-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Navigation Menus' ) }</strong>
					</FlexBlock>
				</Flex>
			}
		>
			<NavigationInspector />
		</DefaultSidebar>
	);
}
