/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Pagination from './pagination';
import ViewActions from './view-actions';
import Filters from './filters';
import Search from './search';
import { LAYOUT_TABLE, LAYOUT_GRID } from './constants';
import { VIEW_LAYOUTS } from './layouts';
import {
	default as BulkActions,
	useSomeItemHasAPossibleBulkAction,
} from './bulk-actions';
import { normalizeFields } from './normalize-fields';
import BulkActionsToolbar from './bulk-actions-toolbar';
import type {
	Action,
	Field,
	View,
	ViewBaseProps,
	SupportedLayouts,
} from './types';
import type { SetSelection, SelectionOrUpdater } from './private-types';

type ItemWithId = { id: string };

type DataViewsProps< Item > = {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	search?: boolean;
	searchLabel?: string;
	actions?: Action< Item >[];
	data: Item[];
	isLoading?: boolean;
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
	defaultLayouts: SupportedLayouts;
	selection?: string[];
	setSelection?: SetSelection;
	onChangeSelection?: ( items: Item[] ) => void;
} & ( Item extends ItemWithId
	? { getItemId?: ( item: Item ) => string }
	: { getItemId: ( item: Item ) => string } );

const defaultGetItemId = ( item: ItemWithId ) => item.id;

const defaultOnChangeSelection = () => {};

export default function DataViews< Item >( {
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
	defaultLayouts,
	selection: selectionProperty,
	setSelection: setSelectionProperty,
	onChangeSelection = defaultOnChangeSelection,
}: DataViewsProps< Item > ) {
	const [ selectionState, setSelectionState ] = useState< string[] >( [] );
	const isUncontrolled =
		selectionProperty === undefined || setSelectionProperty === undefined;
	const selection = isUncontrolled ? selectionState : selectionProperty;
	const setSelection = isUncontrolled
		? setSelectionState
		: setSelectionProperty;
	const [ openedFilter, setOpenedFilter ] = useState< string | null >( null );

	function setSelectionWithChange( value: SelectionOrUpdater ) {
		const newValue =
			typeof value === 'function' ? value( selection ) : value;
		onChangeSelection(
			data.filter( ( item ) => newValue.includes( getItemId( item ) ) )
		);
		return setSelection( value );
	}

	const ViewComponent = VIEW_LAYOUTS.find( ( v ) => v.type === view.type )
		?.component as ComponentType< ViewBaseProps< Item > >;
	const _fields = useMemo( () => normalizeFields( fields ), [ fields ] );

	const hasPossibleBulkAction = useSomeItemHasAPossibleBulkAction(
		actions,
		data
	);
	const _selection = useMemo( () => {
		return selection.filter( ( id ) =>
			data.some( ( item ) => getItemId( item ) === id )
		);
	}, [ selection, data, getItemId ] );
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
							onChangeSelection={ setSelectionWithChange }
							selection={ _selection }
							getItemId={ getItemId }
						/>
					) }
				<ViewActions
					fields={ _fields }
					view={ view }
					onChangeView={ onChangeView }
					defaultLayouts={ defaultLayouts }
				/>
			</HStack>
			<ViewComponent
				actions={ actions }
				data={ data }
				fields={ _fields }
				getItemId={ getItemId }
				isLoading={ isLoading }
				onChangeView={ onChangeView }
				onChangeSelection={ setSelectionWithChange }
				selection={ _selection }
				setOpenedFilter={ setOpenedFilter }
				view={ view }
			/>
			<Pagination
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
			/>
			{ [ LAYOUT_TABLE, LAYOUT_GRID ].includes( view.type ) &&
				hasPossibleBulkAction && (
					<BulkActionsToolbar
						data={ data }
						actions={ actions }
						selection={ _selection }
						onChangeSelection={ setSelectionWithChange }
						getItemId={ getItemId }
					/>
				) }
		</div>
	);
}
