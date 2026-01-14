/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { MainSidebarNavigationContent } from '../sidebar-navigation-screen-main';

export function SidebarNavigationItemGuidelines( props ) {
	return <SidebarNavigationItem { ...props } />;
}

export default function SidebarNavigationScreenGuidelines() {
	return (
		<SidebarNavigationScreen
			title={ __( 'Design' ) }
			isRoot
			description={ __(
				'Customize the appearance of your website using the block editor.'
			) }
			content={
				<MainSidebarNavigationContent activeItem="guidelines-navigation-item" />
			}
		/>
	);
}
