/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { MainSidebarNavigationContent } from '../sidebar-navigation-screen-main';

const { useLocation } = unlock( routerPrivateApis );

export function SidebarNavigationItemIdentity( props ) {
	const { name } = useLocation();
	return (
		<SidebarNavigationItem
			{ ...props }
			aria-current={ name === 'identity' }
		/>
	);
}

export default function SidebarNavigationScreenIdentity() {
	return (
		<SidebarNavigationScreen
			isRoot
			title={ __( 'Design' ) }
			description={ __(
				'Customize the appearance of your website using the block editor.'
			) }
			content={ <MainSidebarNavigationContent /> }
		/>
	);
}
