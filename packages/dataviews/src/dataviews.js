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
import { VIEW_LAYOUTS, LAYOUT_TABLE } from './constants';
import BulkActions from './bulk-actions';

const defaultGetItemId = ( item ) => item.id;
const defaultOnSelectionChange = () => {};

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
	onSelectionChange = defaultOnSelectionChange,
	onDetailsChange = null,
	deferredRendering = false,
	labels,
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
					className="dataviews-filters__view-actions"
				>
					<HStack justify="start" wrap>
						{ view.type === LAYOUT_TABLE && (
							<BulkActions
								actions={ actions }
								data={ data }
								onSelectionChange={ onSetSelection }
								selection={ selection }
								getItemId={ getItemId }
							/>
						) }
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
					onDetailsChange={ onDetailsChange }
					selection={ selection }
					deferredRendering={ deferredRendering }
					labels={ labels }
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
