/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	CheckboxControl,
	Spinner,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	useEffect,
	useId,
	useRef,
	useState,
	useMemo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import SingleSelectionCheckbox from '../../components/dataviews-selection-checkbox';
import ItemActions from '../../components/dataviews-item-actions';
import { sortValues } from '../../constants';
import {
	useSomeItemHasAPossibleBulkAction,
	useHasAPossibleBulkAction,
} from '../../components/dataviews-bulk-actions';
import type {
	Action,
	NormalizedField,
	ViewTable as ViewTableType,
	ViewTableProps,
	CombinedField,
} from '../../types';
import type { SetSelection } from '../../private-types';
import ColumnHeaderMenu from './column-header-menu';

interface BulkSelectionCheckboxProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
}

interface TableColumnFieldProps< Item > {
	primaryField?: NormalizedField< Item >;
	field: NormalizedField< Item >;
	item: Item;
}

interface TableColumnCombinedProps< Item > {
	primaryField?: NormalizedField< Item >;
	fields: NormalizedField< Item >[];
	field: CombinedField;
	item: Item;
	view: ViewTableType;
}

interface TableColumnProps< Item > {
	primaryField?: NormalizedField< Item >;
	fields: NormalizedField< Item >[];
	item: Item;
	column: string;
	view: ViewTableType;
}

interface TableRowProps< Item > {
	hasBulkActions: boolean;
	item: Item;
	actions: Action< Item >[];
	fields: NormalizedField< Item >[];
	id: string;
	view: ViewTableType;
	primaryField?: NormalizedField< Item >;
	selection: string[];
	getItemId: ( item: Item ) => string;
	onChangeSelection: SetSelection;
}

function BulkSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	data,
	actions,
	getItemId,
}: BulkSelectionCheckboxProps< Item > ) {
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return actions.some(
				( action ) =>
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ data, actions ] );
	const selectedItems = data.filter(
		( item ) =>
			selection.includes( getItemId( item ) ) &&
			selectableItems.includes( item )
	);
	const areAllSelected = selectedItems.length === selectableItems.length;
	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			__nextHasNoMarginBottom
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && !! selectedItems.length }
			onChange={ () => {
				if ( areAllSelected ) {
					onChangeSelection( [] );
				} else {
					onChangeSelection(
						selectableItems.map( ( item ) => getItemId( item ) )
					);
				}
			} }
			aria-label={
				areAllSelected ? __( 'Deselect all' ) : __( 'Select all' )
			}
		/>
	);
}

function TableColumn< Item >( {
	column,
	fields,
	view,
	...props
}: TableColumnProps< Item > ) {
	const field = fields.find( ( f ) => f.id === column );
	if ( !! field ) {
		return <TableColumnField { ...props } field={ field } />;
	}
	const combinedField = view.layout?.combinedFields?.find(
		( f ) => f.id === column
	);
	if ( !! combinedField ) {
		return (
			<TableColumnCombined
				{ ...props }
				fields={ fields }
				view={ view }
				field={ combinedField }
			/>
		);
	}

	return null;
}

function TableColumnField< Item >( {
	primaryField,
	item,
	field,
}: TableColumnFieldProps< Item > ) {
	return (
		<div
			className={ clsx( 'dataviews-view-table__cell-content-wrapper', {
				'dataviews-view-table__primary-field':
					primaryField?.id === field.id,
			} ) }
		>
			<field.render { ...{ item } } />
		</div>
	);
}

function TableColumnCombined< Item >( {
	field,
	...props
}: TableColumnCombinedProps< Item > ) {
	const children = field.children.map( ( child ) => (
		<TableColumn key={ child } { ...props } column={ child } />
	) );

	if ( field.direction === 'horizontal' ) {
		return <HStack spacing={ 3 }>{ children }</HStack>;
	}
	return <VStack spacing={ 0 }>{ children }</VStack>;
}

function TableRow< Item >( {
	hasBulkActions,
	item,
	actions,
	fields,
	id,
	view,
	primaryField,
	selection,
	getItemId,
	onChangeSelection,
}: TableRowProps< Item > ) {
	const hasPossibleBulkAction = useHasAPossibleBulkAction( actions, item );
	const isSelected = hasPossibleBulkAction && selection.includes( id );
	const [ isHovered, setIsHovered ] = useState( false );

	const handleMouseEnter = () => {
		setIsHovered( true );
	};
	const handleMouseLeave = () => {
		setIsHovered( false );
	};

	// Will be set to true if `onTouchStart` fires. This happens before
	// `onClick` and can be used to exclude touchscreen devices from certain
	// behaviours.
	const isTouchDevice = useRef( false );
	const columns = view.fields || fields.map( ( f ) => f.id );

	return (
		<tr
			className={ clsx( 'dataviews-view-table__row', {
				'is-selected': hasPossibleBulkAction && isSelected,
				'is-hovered': isHovered,
				'has-bulk-actions': hasPossibleBulkAction,
			} ) }
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
			onTouchStart={ () => {
				isTouchDevice.current = true;
			} }
			onClick={ () => {
				if ( ! hasPossibleBulkAction ) {
					return;
				}
				if (
					! isTouchDevice.current &&
					document.getSelection()?.type !== 'Range'
				) {
					onChangeSelection(
						selection.includes( id )
							? selection.filter( ( itemId ) => id !== itemId )
							: [ id ]
					);
				}
			} }
		>
			{ hasBulkActions && (
				<td
					className="dataviews-view-table__checkbox-column"
					style={ {
						width: '1%',
					} }
				>
					<div className="dataviews-view-table__cell-content-wrapper">
						<SingleSelectionCheckbox
							item={ item }
							selection={ selection }
							onChangeSelection={ onChangeSelection }
							getItemId={ getItemId }
							primaryField={ primaryField }
							disabled={ ! hasPossibleBulkAction }
						/>
					</div>
				</td>
			) }
			{ columns.map( ( column: string ) => {
				// Explicits picks the supported styles.
				const { width, maxWidth, minWidth } =
					view.layout?.styles?.[ column ] ?? {};

				return (
					<td key={ column } style={ { width, maxWidth, minWidth } }>
						<TableColumn
							primaryField={ primaryField }
							fields={ fields }
							item={ item }
							column={ column }
							view={ view }
						/>
					</td>
				);
			} ) }
			{ !! actions?.length && (
				// Disable reason: we are not making the element interactive,
				// but preventing any click events from bubbling up to the
				// table row. This allows us to add a click handler to the row
				// itself (to toggle row selection) without erroneously
				// intercepting click events from ItemActions.

				/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
				<td
					className="dataviews-view-table__actions-column"
					onClick={ ( e ) => e.stopPropagation() }
				>
					<ItemActions item={ item } actions={ actions } />
				</td>
				/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
			) }
		</tr>
	);
}

function ViewTable< Item >( {
	actions,
	data,
	fields,
	getItemId,
	isLoading = false,
	onChangeView,
	onChangeSelection,
	selection,
	setOpenedFilter,
	view,
}: ViewTableProps< Item > ) {
	const headerMenuRefs = useRef<
		Map< string, { node: HTMLButtonElement; fallback: string } >
	>( new Map() );
	const headerMenuToFocusRef = useRef< HTMLButtonElement >();
	const [ nextHeaderMenuToFocus, setNextHeaderMenuToFocus ] =
		useState< HTMLButtonElement >();
	const hasBulkActions = useSomeItemHasAPossibleBulkAction( actions, data );

	useEffect( () => {
		if ( headerMenuToFocusRef.current ) {
			headerMenuToFocusRef.current.focus();
			headerMenuToFocusRef.current = undefined;
		}
	} );

	const tableNoticeId = useId();

	if ( nextHeaderMenuToFocus ) {
		// If we need to force focus, we short-circuit rendering here
		// to prevent any additional work while we handle that.
		// Clearing out the focus directive is necessary to make sure
		// future renders don't cause unexpected focus jumps.
		headerMenuToFocusRef.current = nextHeaderMenuToFocus;
		setNextHeaderMenuToFocus( undefined );
		return;
	}

	const onHide = ( field: NormalizedField< Item > ) => {
		const hidden = headerMenuRefs.current.get( field.id );
		const fallback = hidden
			? headerMenuRefs.current.get( hidden.fallback )
			: undefined;
		setNextHeaderMenuToFocus( fallback?.node );
	};

	const columns = view.fields || fields.map( ( f ) => f.id );
	const hasData = !! data?.length;

	const primaryField = fields.find(
		( field ) => field.id === view.layout?.primaryField
	);

	return (
		<>
			<table
				className="dataviews-view-table"
				aria-busy={ isLoading }
				aria-describedby={ tableNoticeId }
			>
				<thead>
					<tr className="dataviews-view-table__row">
						{ hasBulkActions && (
							<th
								className="dataviews-view-table__checkbox-column"
								style={ {
									width: '1%',
								} }
								scope="col"
							>
								<BulkSelectionCheckbox
									selection={ selection }
									onChangeSelection={ onChangeSelection }
									data={ data }
									actions={ actions }
									getItemId={ getItemId }
								/>
							</th>
						) }
						{ columns.map( ( column, index ) => {
							// Explicits picks the supported styles.
							const { width, maxWidth, minWidth } =
								view.layout?.styles?.[ column ] ?? {};
							return (
								<th
									key={ column }
									style={ { width, maxWidth, minWidth } }
									aria-sort={
										view.sort?.field === column
											? sortValues[ view.sort.direction ]
											: undefined
									}
									scope="col"
								>
									<ColumnHeaderMenu
										ref={ ( node ) => {
											if ( node ) {
												headerMenuRefs.current.set(
													column,
													{
														node,
														fallback:
															columns[
																index > 0
																	? index - 1
																	: 1
															],
													}
												);
											} else {
												headerMenuRefs.current.delete(
													column
												);
											}
										} }
										fieldId={ column }
										view={ view }
										fields={ fields }
										onChangeView={ onChangeView }
										onHide={ onHide }
										setOpenedFilter={ setOpenedFilter }
									/>
								</th>
							);
						} ) }
						{ !! actions?.length && (
							<th className="dataviews-view-table__actions-column">
								<span className="dataviews-view-table-header">
									{ __( 'Actions' ) }
								</span>
							</th>
						) }
					</tr>
				</thead>
				<tbody>
					{ hasData &&
						data.map( ( item, index ) => (
							<TableRow
								key={ getItemId( item ) }
								item={ item }
								hasBulkActions={ hasBulkActions }
								actions={ actions }
								fields={ fields }
								id={ getItemId( item ) || index.toString() }
								view={ view }
								primaryField={ primaryField }
								selection={ selection }
								getItemId={ getItemId }
								onChangeSelection={ onChangeSelection }
							/>
						) ) }
				</tbody>
			</table>
			<div
				className={ clsx( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! hasData && ! isLoading,
				} ) }
				id={ tableNoticeId }
			>
				{ ! hasData && (
					<p>{ isLoading ? <Spinner /> : __( 'No results' ) }</p>
				) }
			</div>
		</>
	);
}

export default ViewTable;
