/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { default as DataViewsBulkActions } from '../dataviews-bulk-actions';
import DataViewsBulkActionsToolbar from '../dataviews-bulk-actions-toolbar';
import DataViewsContext from '../dataviews-context';
import {
	default as DataViewsFilters,
	useFilters,
	FilterVisibilityToggle,
} from '../dataviews-filters';
import DataViewsLayout from '../dataviews-layout';
import DataviewsPagination from '../dataviews-pagination';
import DataViewsSearch from '../dataviews-search';
import DataViewsViewConfig from '../dataviews-view-config';
import { normalizeFields } from '../../normalize-fields';
import type { Action, Field, View, SupportedLayouts } from '../../types';
import type { SelectionOrUpdater } from '../../private-types';
import DensityPicker from '../../layouts/grid/density-picker';
import { LAYOUT_GRID } from '../../constants';

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
	onChangeSelection?: ( items: string[] ) => void;
	header?: ReactNode;
} & ( Item extends ItemWithId
	? { getItemId?: ( item: Item ) => string }
	: { getItemId: ( item: Item ) => string } );

const defaultGetItemId = ( item: ItemWithId ) => item.id;

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
	onChangeSelection,
	header,
}: DataViewsProps< Item > ) {
	const [ selectionState, setSelectionState ] = useState< string[] >( [] );
	const [ density, setDensity ] = useState< number >( 0 );
	const [ isShowingFilter, setIsShowingFilter ] =
		useState< boolean >( false );
	const isUncontrolled =
		selectionProperty === undefined || onChangeSelection === undefined;
	const selection = isUncontrolled ? selectionState : selectionProperty;
	const [ openedFilter, setOpenedFilter ] = useState< string | null >( null );
	function setSelectionWithChange( value: SelectionOrUpdater ) {
		const newValue =
			typeof value === 'function' ? value( selection ) : value;
		if ( isUncontrolled ) {
			setSelectionState( newValue );
		}
		if ( onChangeSelection ) {
			onChangeSelection( newValue );
		}
	}
	const _fields = useMemo( () => normalizeFields( fields ), [ fields ] );
	const _selection = useMemo( () => {
		return selection.filter( ( id ) =>
			data.some( ( item ) => getItemId( item ) === id )
		);
	}, [ selection, data, getItemId ] );

	const filters = useFilters( _fields, view );
	return (
		<DataViewsContext.Provider
			value={ {
				view,
				onChangeView,
				fields: _fields,
				actions,
				data,
				isLoading,
				paginationInfo,
				selection: _selection,
				onChangeSelection: setSelectionWithChange,
				openedFilter,
				setOpenedFilter,
				getItemId,
				density,
			} }
		>
			<div className="dataviews-wrapper">
				<HStack
					alignment="top"
					justify="start"
					className="dataviews__view-actions"
					spacing={ 1 }
				>
					<HStack justify="start" wrap>
						{ search && <DataViewsSearch label={ searchLabel } /> }
						<FilterVisibilityToggle
							filters={ filters }
							view={ view }
							onChangeView={ onChangeView }
							setOpenedFilter={ setOpenedFilter }
							setIsShowingFilter={ setIsShowingFilter }
							isShowingFilter={ isShowingFilter }
						/>
					</HStack>
					{ view.type === LAYOUT_GRID && (
						<DensityPicker
							density={ density }
							setDensity={ setDensity }
						/>
					) }
					<DataViewsBulkActions />
					<HStack
						spacing={ 1 }
						expanded={ false }
						style={ { flexShrink: 0 } }
					>
						<DataViewsViewConfig
							defaultLayouts={ defaultLayouts }
						/>
						{ header }
					</HStack>
				</HStack>
				{ isShowingFilter && <DataViewsFilters /> }
				<DataViewsLayout />
				<DataviewsPagination />
				<DataViewsBulkActionsToolbar />
			</div>
		</DataViewsContext.Provider>
	);
}
