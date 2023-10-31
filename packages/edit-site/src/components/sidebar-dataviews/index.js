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
import { default as DEFAULT_VIEWS } from '../dataviews/default-views';
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );
import SidebarNavigationItem from '../sidebar-navigation-item';

function DataViewItem( { dataview, isActive } ) {
	const {
		params: { path },
	} = useLocation();
	let icon;
	switch ( dataview.view.type ) {
		case 'list':
			icon = page;
			break;
		case 'grid':
			icon = columns;
			break;
	}
	const linkInfo = useLink( {
		path,
		currentView: dataview.slug,
	} );
	return (
		<SidebarNavigationItem
			icon={ icon }
			{ ...linkInfo }
			aria-current={ isActive ? 'true' : undefined }
		>
			{ dataview.title }
		</SidebarNavigationItem>
	);
}

const PATH_TO_DATAVIEW_TYPE = {
	'/pages': 'page',
};

export default function DataViewsSidebarContent() {
	const {
		params: { path, currentView = 'all' },
	} = useLocation();
	const viewType = PATH_TO_DATAVIEW_TYPE[ path ];

	return (
		<ItemGroup>
			{ DEFAULT_VIEWS[ viewType ].map( ( dataview ) => {
				return (
					<DataViewItem
						key={ dataview.slug }
						dataview={ dataview }
						isActive={ dataview.slug === currentView }
					/>
				);
			} ) }
		</ItemGroup>
	);
}
