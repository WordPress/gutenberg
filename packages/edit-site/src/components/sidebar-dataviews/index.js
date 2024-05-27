/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';

import { privateApis as routerPrivateApis } from '@wordpress/router';
/**
 * Internal dependencies
 */

import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );
import DataViewItem from './dataview-item';
import CustomDataViewsList from './custom-dataviews-list';
import useDataViews from './use-data-views';

export default function DataViewsSidebarContent() {
	const {
		params: { postType, activeView = 'all', isCustom = 'false' },
	} = useLocation();
	const views = useDataViews( postType );
	if ( ! postType ) {
		return null;
	}
	const isCustomBoolean = isCustom === 'true';

	return (
		<>
			<ItemGroup>
				{ views.map( ( dataview ) => {
					return (
						<DataViewItem
							key={ dataview.slug }
							slug={ dataview.slug }
							count={ dataview.records?.length || 0 }
							title={ dataview.title }
							icon={ dataview.icon }
							type={ dataview.view.type }
							isActive={
								! isCustomBoolean &&
								dataview.slug === activeView
							}
							isCustom={ false }
						/>
					);
				} ) }
			</ItemGroup>
			{ window?.__experimentalCustomViews && (
				<CustomDataViewsList
					activeView={ activeView }
					type={ postType }
					isCustom
				/>
			) }
		</>
	);
}
