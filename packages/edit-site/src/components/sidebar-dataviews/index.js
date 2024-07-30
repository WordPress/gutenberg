/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useRef, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useDefaultViews } from './default-views';
import { unlock } from '../../lock-unlock';
import DataViewItem from './dataview-item';
import CustomDataViewsList from './custom-dataviews-list';

const { useLocation, useHistory } = unlock( routerPrivateApis );

/**
 * Hook to switch to table layout when switching to the trash view.
 * When going out of the trash view, it switches back to the previous layout if
 * there was an automatic switch to table layout.
 */
function useSwitchToTableOnTrash() {
	const {
		params: { activeView, layout, ...restParams },
	} = useLocation();
	const history = useHistory();
	const viewToSwitchOutOfTrash = useRef( undefined );
	const previousActiveView = usePrevious( activeView );
	useEffect( () => {
		if ( activeView === 'trash' && previousActiveView !== 'trash' ) {
			viewToSwitchOutOfTrash.current = layout || 'list';
			history.push( { ...restParams, layout: 'table', activeView } );
		} else if (
			previousActiveView === 'trash' &&
			activeView !== 'trash' &&
			viewToSwitchOutOfTrash.current
		) {
			history.push( {
				...restParams,
				layout: viewToSwitchOutOfTrash.current,
				activeView,
			} );
			viewToSwitchOutOfTrash.current = undefined;
		}
	}, [ previousActiveView, activeView, layout, history, restParams ] );
}

export default function DataViewsSidebarContent() {
	const {
		params: { postType, activeView = 'all', isCustom = 'false' },
	} = useLocation();
	useSwitchToTableOnTrash();
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
