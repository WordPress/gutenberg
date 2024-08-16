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
import CustomDataViewsList from './custom-dataviews-list';

const { useLocation } = unlock( routerPrivateApis );

export default function DataViewsSidebarContent() {
	const {
		params: { postType, activeView = 'all', isCustom = 'false' },
	} = useLocation();
	const defaultViews = useDefaultViews( { postType } );
	if ( ! postType ) {
		return null;
	}
	const isCustomBoolean = isCustom === 'true';

	return (
		<>
			<ItemGroup>
				{ defaultViews.map( ( dataview ) => {
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
