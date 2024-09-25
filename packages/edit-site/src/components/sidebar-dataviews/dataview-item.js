/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __experimentalHStack as HStack } from '@wordpress/components';
import { VIEW_LAYOUTS } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );

export default function DataViewItem( {
	title,
	slug,
	customViewId,
	type,
	icon,
	isActive,
	isCustom,
	suffix,
} ) {
	const {
		params: { postType },
	} = useLocation();

	const iconToUse =
		icon || VIEW_LAYOUTS.find( ( v ) => v.type === type ).icon;

	let activeView = isCustom ? customViewId : slug;
	if ( activeView === 'all' ) {
		activeView = undefined;
	}
	const linkInfo = useLink( {
		postType,
		layout: type,
		activeView,
		isCustom: isCustom ? 'true' : undefined,
	} );
	return (
		<HStack
			justify="flex-start"
			className={ clsx( 'edit-site-sidebar-dataviews-dataview-item', {
				'is-selected': isActive,
			} ) }
		>
			<SidebarNavigationItem
				icon={ iconToUse }
				{ ...linkInfo }
				aria-current={ isActive ? 'true' : undefined }
			>
				{ title }
			</SidebarNavigationItem>
			{ suffix }
		</HStack>
	);
}
