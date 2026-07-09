/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import {
	layout,
	symbol,
	navigation,
	styles,
	page,
	siteLogo,
} from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';

export function MainSidebarNavigationContent( { isBlockBasedTheme = true } ) {
	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-main">
			<SidebarNavigationItem
				to="/identity"
				uid="identity-navigation-item"
				icon={ siteLogo }
				activeOnRouteName="identity"
				isHidden={ ! isBlockBasedTheme }
			>
				{ _x( 'Identity', 'site identity' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem
				to={ isBlockBasedTheme ? '/styles' : '/stylebook' }
				uid={
					isBlockBasedTheme
						? 'global-styles-navigation-item'
						: 'stylebook-navigation-item'
				}
				icon={ styles }
				activeOnRouteName={ isBlockBasedTheme ? 'styles' : undefined }
				withChevron={ ! isBlockBasedTheme }
			>
				{ __( 'Styles' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem
				uid="page-navigation-item"
				to="/page"
				withChevron
				icon={ page }
				isHidden={ ! isBlockBasedTheme }
			>
				{ __( 'Pages' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem
				uid="navigation-navigation-item"
				to="/navigation"
				withChevron
				icon={ navigation }
				isHidden={ ! isBlockBasedTheme }
			>
				{ __( 'Navigation' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem
				uid="patterns-navigation-item"
				to="/pattern"
				withChevron
				icon={ symbol }
			>
				{ __( 'Patterns' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem
				uid="template-navigation-item"
				to="/template"
				withChevron
				icon={ layout }
				isHidden={ ! isBlockBasedTheme }
			>
				{ __( 'Templates' ) }
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
