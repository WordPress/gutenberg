/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import DataViewItem from './dataview-item';
import { getDefaultViews } from '../post-list/view-utils';

const { useLocation } = unlock( routerPrivateApis );

export default function DataViewsSidebarContent( { postType } ) {
	const {
		query: { activeView = 'all' },
	} = useLocation();
	const postTypeObject = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			return getPostType( postType );
		},
		[ postType ]
	);
	const defaultViews = useMemo(
		() => getDefaultViews( postTypeObject ),
		[ postTypeObject ]
	);
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
