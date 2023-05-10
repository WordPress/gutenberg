/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalNavigatorButton as NavigatorButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbol, navigation, styles, page } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';

export default function SidebarNavigationScreenMain() {
	const { hasNavigationMenus, hasGlobalStyleVariations } = useSelect(
		( select ) => {
			const {
				getEntityRecords,
				__experimentalGetCurrentThemeGlobalStylesVariations,
			} = select( coreStore );
			// The query needs to be the same as in the "SidebarNavigationScreenNavigationMenus" component,
			// to avoid double network calls.
			const navigationMenus = getEntityRecords(
				'postType',
				'wp_navigation',
				{
					per_page: 1,
					status: 'publish',
					order: 'desc',
					orderby: 'date',
				}
			);
			return {
				hasNavigationMenus: !! navigationMenus?.length,
				hasGlobalStyleVariations:
					!! __experimentalGetCurrentThemeGlobalStylesVariations()
						?.length,
			};
		},
		[]
	);
	const showNavigationScreen = process.env.IS_GUTENBERG_PLUGIN
		? hasNavigationMenus
		: false;
	return (
		<SidebarNavigationScreen
			isRoot
			title={ __( 'Design' ) }
			description={ __(
				'Customize the appearance of your website using the block editor.'
			) }
			content={
				<ItemGroup>
					{ showNavigationScreen && (
						<NavigatorButton
							as={ SidebarNavigationItem }
							path="/navigation"
							withChevron
							icon={ navigation }
						>
							{ __( 'Navigation' ) }
						</NavigatorButton>
					) }
					{ hasGlobalStyleVariations && (
						<NavigatorButton
							as={ SidebarNavigationItem }
							path="/wp_global_styles"
							withChevron
							icon={ styles }
						>
							{ __( 'Styles' ) }
						</NavigatorButton>
					) }

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
						path="/wp_template_part"
						withChevron
						icon={ symbol }
					>
						{ __( 'Template Parts' ) }
					</NavigatorButton>
				</ItemGroup>
			}
		/>
	);
}
