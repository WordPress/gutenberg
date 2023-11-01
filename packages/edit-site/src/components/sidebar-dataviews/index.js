/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { page, columns } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import { default as DEFAULT_VIEWS } from '../page-pages/default-views';
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );
import SidebarNavigationItem from '../sidebar-navigation-item';

function getDataViewIcon( dataview ) {
	const icons = { list: page, grid: columns };
	return icons[ dataview.view.type ];
}

function DataViewItem( { dataview, isActive, icon } ) {
	const {
		params: { path },
	} = useLocation();

	const _icon = icon || getDataViewIcon( dataview );

	const linkInfo = useLink( {
		path,
		activeView: dataview.slug,
	} );
	return (
		<SidebarNavigationItem
			icon={ _icon }
			{ ...linkInfo }
			aria-current={ isActive ? 'true' : undefined }
		>
			{ dataview.title }
		</SidebarNavigationItem>
	);
}

export default function DataViewsSidebarContent() {
	const {
		params: { path, activeView = 'all' },
	} = useLocation();
	if ( ! path || path !== '/pages' ) {
		return null;
	}

	return (
		<ItemGroup>
			{ DEFAULT_VIEWS.map( ( dataview ) => {
				return (
					<DataViewItem
						key={ dataview.slug }
						icon={ dataview.icon }
						dataview={ dataview }
						isActive={ dataview.slug === activeView }
					/>
				);
			} ) }
		</ItemGroup>
	);
}
