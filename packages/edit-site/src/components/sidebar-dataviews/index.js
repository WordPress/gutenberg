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
const { useLocation } = unlock( routerPrivateApis );
import DataViewItem from './dataview-item';
import CustomDataViewsList from './custom-dataviews-list';

export default function DataViewsSidebarContent() {
	const {
		params: { postType, activeView = 'all', isCustom = 'false' },
	} = useLocation();
	const DEFAULT_VIEWS = useDefaultViews( { postType } );
	if ( ! postType ) {
		return null;
	}
	const isCustomBoolean = isCustom === 'true';

	return (
		<>
			<ItemGroup>
				{ DEFAULT_VIEWS[ postType ].map( ( dataview ) => {
					return (
						<DataViewItem
							key={ dataview.slug }
							slug={ dataview.slug }
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
