/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __experimentalHStack as HStack } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );

export default function DataViewItem( {
	title,
	slug,
	icon,
	isActive,
	suffix,
} ) {
	const { path } = useLocation();

	if ( slug === 'all' ) {
		slug = undefined;
	}
	return (
		<HStack
			justify="flex-start"
			className={ clsx( 'edit-site-sidebar-dataviews-dataview-item', {
				'is-selected': isActive,
			} ) }
		>
			<SidebarNavigationItem
				icon={ icon }
				to={ addQueryArgs( path, {
					activeView: slug,
				} ) }
				aria-current={ isActive ? 'true' : undefined }
			>
				{ title }
			</SidebarNavigationItem>
			{ suffix }
		</HStack>
	);
}
