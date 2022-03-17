/**
 * WordPress dependencies
 */
import { FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigation } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DefaultSidebar from '../default-sidebar';
import NavigationInspector from './navigation-inspector';

export default function NavigationMenuSidebar() {
	return (
		<DefaultSidebar
			className="edit-site-navigation-menu-sidebar"
			identifier="edit-site/navigation-menu"
			title={ __( 'Navigation' ) }
			icon={ navigation }
			closeLabel={ __( 'Close navigation menu sidebar' ) }
			panelClassName="edit-site-navigation-menu-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Navigation' ) }</strong>
					</FlexBlock>
				</Flex>
			}
		>
			<NavigationInspector />
		</DefaultSidebar>
	);
}
