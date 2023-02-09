/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalNavigatorButton as NavigatorButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbolFilled, navigation } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';

export default function SidebarNavigationScreenMain() {
	const { navigationMenus } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		return {
			navigationMenus: getEntityRecords( 'postType', 'wp_navigation', {
				per_page: -1,
				status: 'publish',
			} ),
		};
	} );

	return (
		<SidebarNavigationScreen
			path="/"
			title={ __( 'Design' ) }
			content={
				<ItemGroup>
					{ !! navigationMenus && navigationMenus.length > 0 && (
						<NavigatorButton
							as={ SidebarNavigationItem }
							path="/navigation"
							withChevron
							icon={ navigation }
						>
							{ __( 'Navigation' ) }
						</NavigatorButton>
					) }
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
