/**
 * WordPress dependencies
 */
import { page, columns, pullRight } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );

function getDataViewIcon( type ) {
	const icons = { list: page, grid: columns, 'side-by-side': pullRight };
	return icons[ type ];
}

export default function DataViewItem( {
	title,
	slug,
	customViewId,
	type,
	icon,
	isActive,
	isCustom,
} ) {
	const {
		params: { path },
	} = useLocation();

	const iconToUse = icon || getDataViewIcon( type );

	const linkInfo = useLink( {
		path,
		activeView: isCustom === 'true' ? customViewId : slug,
		isCustom,
	} );
	return (
		<SidebarNavigationItem
			icon={ iconToUse }
			{ ...linkInfo }
			aria-current={ isActive ? 'true' : undefined }
		>
			{ title }
		</SidebarNavigationItem>
	);
}
