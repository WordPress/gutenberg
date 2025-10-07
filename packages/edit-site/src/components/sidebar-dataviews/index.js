/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { useDefaultViews } from './default-views';
import { unlock } from '../../lock-unlock';
import DataViewItem from './dataview-item';

const { useLocation } = unlock( routerPrivateApis );

export default function DataViewsSidebarContent( { postType } ) {
	const {
		query: { activeView = 'all' },
	} = useLocation();
	const defaultViews = useDefaultViews( { postType } );
	if ( ! postType ) {
		return null;
	}

	return (
		<>
			<ItemGroup className="edit-site-sidebar-dataviews">
				{ defaultViews.map( ( dataview ) => {
					return (
						<DataViewItem
							key={ dataview.slug }
							slug={ dataview.slug }
							title={ dataview.title }
							icon={ dataview.icon }
							type={ dataview.view.type }
							isActive={ dataview.slug === activeView }
						/>
					);
				} ) }
			</ItemGroup>
		</>
	);
}
