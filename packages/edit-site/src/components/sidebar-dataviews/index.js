/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';

import { privateApis as routerPrivateApis } from '@wordpress/router';
/**
 * Internal dependencies
 */

import { DEFAULT_VIEWS } from './default-views';
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );
import DataViewItem from './dataview-item';
import CustomDataViewsList from './custom-dataviews-list';

const PATH_TO_TYPE = {
	'/pages': 'page',
};

export default function DataViewsSidebarContent() {
	const {
		params: { path, activeView = 'all', isCustom = 'false' },
	} = useLocation();
	if ( ! path || ! PATH_TO_TYPE[ path ] ) {
		return null;
	}
	const type = PATH_TO_TYPE[ path ];

	return (
		<>
			<ItemGroup>
				{ DEFAULT_VIEWS[ type ].map( ( dataview ) => {
					return (
						<DataViewItem
							key={ dataview.slug }
							slug={ dataview.slug }
							title={ dataview.title }
							icon={ dataview.icon }
							type={ dataview.view.type }
							isActive={
								isCustom === 'false' &&
								dataview.slug === activeView
							}
							isCustom="false"
						/>
					);
				} ) }
			</ItemGroup>
			{ window?.__experimentalAdminViews && (
				<CustomDataViewsList
					activeView={ activeView }
					type={ type }
					isCustom="true"
				/>
			) }
		</>
	);
}
