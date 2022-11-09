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

export default function NavigationItemSidebar() {
	return (
		<DefaultSidebar
			className="edit-site-navigation-item-sidebar"
			identifier="edit-site/navigation-item"
			title={ __( 'Navigation Item' ) }
			icon={ navigation }
			closeLabel={ __( 'Close navigation menu sidebar' ) }
			panelClassName="edit-site-navigation-menu-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Navigation Menus' ) }</strong>
						<span className="edit-site-navigation-sidebar__beta">
							{ __( 'Beta' ) }
						</span>
					</FlexBlock>
				</Flex>
			}
		>
			<p>Hello, world</p>
		</DefaultSidebar>
	);
}
