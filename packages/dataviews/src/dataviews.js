/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useMemo, useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Pagination from './pagination';
import ViewActions from './view-actions';
import Filters from './filters';
import Search from './search';
import { VIEW_LAYOUTS } from './constants';

const defaultGetItemId = ( item ) => item.id;

export default function DataViews( {
	view,
	onChangeView,
	fields,
	search = true,
	searchLabel = undefined,
	actions,
	data,
	getItemId = defaultGetItemId,
	isLoading = false,
	paginationInfo,
	supportedLayouts,
	onSelectionChange,
	deferredRendering = false,
} ) {
	const [ selection, setSelection ] = useState( [] );

	const onSetSelection = useCallback(
		( items ) => {
			setSelection( items.map( ( item ) => item.id ) );
			onSelectionChange( items );
		},
		[ setSelection, onSelectionChange ]
	);

	const ViewComponent = VIEW_LAYOUTS.find(
		( v ) => v.type === view.type
	).component;
	const _fields = useMemo( () => {
		return fields.map( ( field ) => ( {
			...field,
			render: field.render || field.getValue,
		} ) );
	}, [ fields ] );
	return (
		<div className="dataviews-wrapper">
			<VStack spacing={ 0 } justify="flex-start">
				<HStack
					alignment="flex-start"
					className="dataviews__filters-view-actions"
				>
					<HStack justify="start" wrap>
						{ search && (
							<Search
								label={ searchLabel }
								view={ view }
								onChangeView={ onChangeView }
							/>
						) }
						<Filters
							fields={ _fields }
							view={ view }
							onChangeView={ onChangeView }
						/>
					</HStack>
					<ViewActions
						fields={ _fields }
						view={ view }
						onChangeView={ onChangeView }
						supportedLayouts={ supportedLayouts }
					/>
				</HStack>
				<ViewComponent
					fields={ _fields }
					view={ view }
					onChangeView={ onChangeView }
					actions={ actions }
					data={ data }
					getItemId={ getItemId }
					isLoading={ isLoading }
					onSelectionChange={ onSetSelection }
					selection={ selection }
					deferredRendering={ deferredRendering }
				/>
				<Pagination
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
				/>
			</VStack>
		</div>
	);
}
