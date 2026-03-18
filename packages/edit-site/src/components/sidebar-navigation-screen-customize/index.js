/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Panel,
	PanelBody,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import {
	styles,
	navigation,
	siteLogo,
	typography,
	color,
	home,
	background,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import './style.scss';

export default function SidebarNavigationScreenCustomize( { backPath } ) {
	return (
		<SidebarNavigationScreen
			backPath={ backPath }
			title={ __( 'Customize' ) }
			description={ __(
				'Quick access to the most common site customization settings.'
			) }
			content={
				<Panel className="edit-site-sidebar-navigation-screen-customize">
					<PanelBody
						title={ __( 'Site Identity' ) }
						icon={ siteLogo }
						initialOpen={ false }
					>
						<ItemGroup>
							<SidebarNavigationItem
								to="/identity"
								icon={ siteLogo }
							>
								{ __( 'Logo & Icon' ) }
							</SidebarNavigationItem>
						</ItemGroup>
					</PanelBody>

					<PanelBody
						title={ __( 'Styles' ) }
						icon={ styles }
						initialOpen={ false }
					>
						<ItemGroup>
							<SidebarNavigationItem to="/styles" icon={ color }>
								{ __( 'Colors' ) }
							</SidebarNavigationItem>
							<SidebarNavigationItem
								to="/styles"
								icon={ typography }
							>
								{ __( 'Typography' ) }
							</SidebarNavigationItem>
							<SidebarNavigationItem
								to="/styles"
								icon={ background }
							>
								{ __( 'Background' ) }
							</SidebarNavigationItem>
						</ItemGroup>
					</PanelBody>

					<PanelBody
						title={ __( 'Navigation' ) }
						icon={ navigation }
						initialOpen={ false }
					>
						<ItemGroup>
							<SidebarNavigationItem
								to="/navigation"
								withChevron
								icon={ navigation }
							>
								{ __( 'Menus' ) }
							</SidebarNavigationItem>
						</ItemGroup>
					</PanelBody>

					<PanelBody
						title={ __( 'Homepage Settings' ) }
						icon={ home }
						initialOpen={ false }
					>
						<ItemGroup>
							<div className="edit-site-sidebar-navigation-screen-customize__homepage-note">
								<p>
									{ __(
										'Configure your homepage in WordPress Settings → Reading.'
									) }
								</p>
							</div>
						</ItemGroup>
					</PanelBody>
				</Panel>
			}
		/>
	);
}
