/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationScreen from '../sidebar-navigation-screen';

export default function SidebarNavigationScreenMedia() {
	return (
		<SidebarNavigationScreen
			title={ __( 'Media' ) }
			description={ __(
				'Media media media.'
			) }
			actions={ null }
			footer={ __( 'Media footer' ) }
			content={ __( 'Media content' ) }
		/>
	);
}
