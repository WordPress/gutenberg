/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Pagination from './pagination';
import ViewActions from './view-actions';
import Filters from './filters';
import Search from './search';
import { VIEW_LAYOUTS, LAYOUT_TABLE, LAYOUT_GRID } from './constants';
import BulkActions from './bulk-actions';
import { normalizeFields } from './normalize-fields';

const defaultGetItemId = ( item ) => item.id;
const defaultOnSelectionChange = () => {};

function useSomeItemHasAPossibleBulkAction( actions, data ) {
	return useMemo( () => {
		return data.some( ( item ) => {
			return actions.some( ( action ) => {
				return action.supportsBulk && action.isEligible( item );
			} );
		} );
	}, [ actions, data ] );
}

export default function DataViews( {
	view,
	onChangeView,
	fields,
	search = true,
	searchLabel = undefined,
	actions = [],
	data,
	getItemId = defaultGetItemId,
	isLoading = false,
	paginationInfo,
	supportedLayouts,
	onSelectionChange = defaultOnSelectionChange,
} ) {
	const [ selection, setSelection ] = useState( [] );
	const [ openedFilter, setOpenedFilter ] = useState( null );

	useEffect( () => {
		if (
			selection.length > 0 &&
			selection.some(
				( id ) => ! data.some( ( item ) => getItemId( item ) === id )
			)
		) {
			const newSelection = selection.filter( ( id ) =>
				data.some( ( item ) => getItemId( item ) === id )
			);
			setSelection( newSelection );
			onSelectionChange(
				data.filter( ( item ) =>
					newSelection.includes( getItemId( item ) )
				)
			);
		}
	}, [ selection, data, getItemId, onSelectionChange ] );

	const onSetSelection = useCallback(
		( items ) => {
			setSelection( items.map( ( item ) => getItemId( item ) ) );
			onSelectionChange( items );
		},
		[ setSelection, getItemId, onSelectionChange ]
	);

	const ViewComponent = VIEW_LAYOUTS.find(
		( v ) => v.type === view.type
	).component;
	const _fields = useMemo( () => normalizeFields( fields ), [ fields ] );

	const hasPossibleBulkAction = useSomeItemHasAPossibleBulkAction(
		actions,
		data
	);
	return (
		<div className="dataviews-wrapper">
			<HStack
				alignment="top"
				justify="start"
				className="dataviews-filters__view-actions"
			>
				<HStack
					justify="start"
					className="dataviews-filters__container"
					wrap
				>
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
						openedFilter={ openedFilter }
						setOpenedFilter={ setOpenedFilter }
					/>
				</HStack>
				{ [ LAYOUT_TABLE, LAYOUT_GRID ].includes( view.type ) &&
					hasPossibleBulkAction && (
						<BulkActions
							actions={ actions }
							data={ data }
							onSelectionChange={ onSetSelection }
							selection={ selection }
							getItemId={ getItemId }
						/>
					) }
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
				setOpenedFilter={ setOpenedFilter }
			/>
			<Pagination
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
			/>
		</div>
	);
}
