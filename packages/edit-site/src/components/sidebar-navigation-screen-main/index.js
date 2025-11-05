/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbol, navigation, styles, page } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { SidebarNavigationItemGlobalStyles } from '../sidebar-navigation-screen-global-styles';

export function MainSidebarNavigationContent( { isBlockBasedTheme = true } ) {
	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-main">
			{ isBlockBasedTheme && (
				<>
					<SidebarNavigationItemGlobalStyles
						to="/styles"
						uid="global-styles-navigation-item"
						icon={ styles }
					>
						{ __( 'Styles' ) }
					</SidebarNavigationItemGlobalStyles>
					<SidebarNavigationItem
						uid="navigation-navigation-item"
						to="/navigation"
						withChevron
						icon={ navigation }
					>
						{ __( 'Navigation' ) }
					</SidebarNavigationItem>
					<SidebarNavigationItem
						uid="page-navigation-item"
						to="/page"
						withChevron
						icon={ page }
					>
						{ __( 'Pages' ) }
					</SidebarNavigationItem>
					<SidebarNavigationItem
						uid="template-navigation-item"
						to="/template"
						withChevron
						icon={ layout }
					>
						{ __( 'Templates' ) }
					</SidebarNavigationItem>
				</>
			) }
			{ ! isBlockBasedTheme && (
				<SidebarNavigationItem
					uid="stylebook-navigation-item"
					to="/stylebook"
					withChevron
					icon={ styles }
				>
					{ __( 'Styles' ) }
				</SidebarNavigationItem>
			) }
			<SidebarNavigationItem
				uid="patterns-navigation-item"
				to="/pattern"
				withChevron
				icon={ symbol }
			>
				{ __( 'Patterns' ) }
			</SidebarNavigationItem>
		</ItemGroup>
	);
}

export default function SidebarNavigationScreenMain( { customDescription } ) {
	const isBlockBasedTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.is_block_theme,
		[]
	);

	let description;
	if ( customDescription ) {
		description = customDescription;
	} else if ( isBlockBasedTheme ) {
		description = __(
			'Customize the appearance of your website using the block editor.'
		);
	} else {
		description = __(
			'Explore block styles and patterns to refine your site.'
		);
	}

	return (
		<SidebarNavigationScreen
			isRoot
			title={ __( 'Design' ) }
			description={ description }
			content={
				<MainSidebarNavigationContent
					isBlockBasedTheme={ isBlockBasedTheme }
				/>
			}
		/>
	);
}
