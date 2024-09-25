/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import {
	default as DataViewsFilters,
	useFilters,
	FilterVisibilityToggle,
} from '../dataviews-filters';
import DataViewsLayout from '../dataviews-layout';
import DataViewsFooter from '../dataviews-footer';
import DataViewsSearch from '../dataviews-search';
import DataViewsViewConfig from '../dataviews-view-config';
import { normalizeFields } from '../../normalize-fields';
import type {
	Action,
	Field,
	View,
	SupportedLayouts,
	ActionContext,
} from '../../types';
import type { SelectionOrUpdater } from '../../private-types';
import { __ } from '@wordpress/i18n';
import { pin } from '@wordpress/icons';

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
	onPinItem?: ( itemId: string ) => void;
	onUnpinItem?: ( itemId: string ) => void;
	pinnedItems?: string[];
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
	pinnedItems = [],
}: DataViewsProps< Item > ) {
	const [ selectionState, setSelectionState ] = useState< string[] >( [] );
	const [ density, setDensity ] = useState< number >( 0 );
	const isUncontrolled =
		selectionProperty === undefined || onChangeSelection === undefined;
	const selection = isUncontrolled ? selectionState : selectionProperty;
	const [ openedFilter, setOpenedFilter ] = useState< string | null >( null );
	const [ pinnedItemsState, setPinnedItemsState ] =
		useState< string[] >( pinnedItems );
	const onPinItem = useCallback( ( itemId: string ) => {
		setPinnedItemsState( ( prev ) => [
			...new Set( [ ...prev, itemId ] ),
		] );
	}, [] );
	const onUnpinItem = useCallback( ( itemId: string ) => {
		setPinnedItemsState( ( prev ) =>
			prev.filter( ( id ) => id !== itemId )
		);
	}, [] );
	const combinedPinnedItems = useMemo(
		() => [ ...new Set( [ ...pinnedItems, ...pinnedItemsState ] ) ],
		[ pinnedItems, pinnedItemsState ]
	);

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
	const [ isShowingFilter, setIsShowingFilter ] = useState< boolean >( () =>
		( filters || [] ).some( ( filter ) => filter.isPrimary )
	);

	// Sort pinned items to the top of the data array
	const dataWithPinnedItems = useMemo( () => {
		return [ ...data ].sort( ( a, b ) => {
			const aId = getItemId( a );
			const bId = getItemId( b );
			const aIsPinned = combinedPinnedItems.includes( aId );
			const bIsPinned = combinedPinnedItems.includes( bId );

			if ( aIsPinned && ! bIsPinned ) {
				return -1;
			}
			if ( ! aIsPinned && bIsPinned ) {
				return 1;
			}
			return 0;
		} );
	}, [ data, getItemId, combinedPinnedItems ] );

	const createDefaultActions = useCallback(
		( callback: ( items: Item[], context: any ) => void ) => {
			return [
				{
					id: 'togglePin',
					label: ( items: Item[] ) => {
						const itemId = getItemId( items[ 0 ] );
						return combinedPinnedItems.includes( itemId )
							? __( 'Unpin' )
							: __( 'Pin' );
					},
					isPrimary: true,
					icon: pin,
					callback: (
						items: Item[],
						context: ActionContext< Item >
					) => {
						items.forEach( ( item ) => {
							const itemId = getItemId( item );
							if ( combinedPinnedItems.includes( itemId ) ) {
								onUnpinItem( itemId );
							} else {
								onPinItem( itemId );
							}
						} );
						callback( items, context );
					},
				},
			];
		},
		[ getItemId, onPinItem, onUnpinItem, combinedPinnedItems ]
	);

	const actionsWithDefaultActions = useMemo( () => {
		const defaultActions = createDefaultActions(
			( items, context ) => context.onActionPerformed?.( items )
		);
		return [ ...defaultActions, ...actions ]; // Combine default and custom actions
	}, [ actions, createDefaultActions ] );

	return (
		<DataViewsContext.Provider
			value={ {
				view,
				onChangeView,
				fields: _fields,
				actions: actionsWithDefaultActions,
				data: dataWithPinnedItems,
				isLoading,
				paginationInfo,
				selection: _selection,
				onChangeSelection: setSelectionWithChange,
				openedFilter,
				setOpenedFilter,
				getItemId,
				density,
				onPinItem,
				onUnpinItem,
				pinnedItems: combinedPinnedItems,
			} }
		>
			<div className="dataviews-wrapper">
				<HStack
					alignment="top"
					justify="space-between"
					className="dataviews__view-actions"
					spacing={ 1 }
				>
					<HStack
						justify="start"
						expanded={ false }
						className="dataviews__search"
					>
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
					<HStack
						spacing={ 1 }
						expanded={ false }
						style={ { flexShrink: 0 } }
					>
						<DataViewsViewConfig
							defaultLayouts={ defaultLayouts }
							density={ density }
							setDensity={ setDensity }
						/>
						{ header }
					</HStack>
				</HStack>
				{ isShowingFilter && <DataViewsFilters /> }
				<DataViewsLayout />
				<DataViewsFooter />
			</div>
		</DataViewsContext.Provider>
	);
}
