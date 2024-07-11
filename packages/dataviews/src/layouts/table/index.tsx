/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode, Ref, PropsWithoutRef, RefAttributes } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { unseen, funnel } from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
	CheckboxControl,
	Spinner,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	forwardRef,
	useEffect,
	useId,
	useRef,
	useState,
	useMemo,
	Children,
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import SingleSelectionCheckbox from '../../single-selection-checkbox';
import { unlock } from '../../lock-unlock';
import ItemActions from '../../item-actions';
import { sanitizeOperators } from '../../utils';
import {
	SORTING_DIRECTIONS,
	sortArrows,
	sortLabels,
	sortValues,
} from '../../constants';
import {
	useSomeItemHasAPossibleBulkAction,
	useHasAPossibleBulkAction,
} from '../../bulk-actions';
import type {
	Action,
	NormalizedField,
	SortDirection,
	ViewTable as ViewTableType,
	ViewTableProps,
	CombinedField,
} from '../../types';
import type { SetSelection } from '../../private-types';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

interface HeaderMenuProps< Item > {
	fieldId: string;
	view: ViewTableType;
	fields: NormalizedField< Item >[];
	onChangeView: ( view: ViewTableType ) => void;
	onHide: ( field: NormalizedField< Item > ) => void;
	setOpenedFilter: ( fieldId: string ) => void;
}

interface BulkSelectionCheckboxProps< Item > {
	selection: string[];
	onSelectionChange: SetSelection;
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
	onSelectionChange: SetSelection;
}

function WithDropDownMenuSeparators( { children }: { children: ReactNode } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}

const _HeaderMenu = forwardRef( function HeaderMenu< Item >(
	{
		fieldId,
		view,
		fields,
		onChangeView,
		onHide,
		setOpenedFilter,
	}: HeaderMenuProps< Item >,
	ref: Ref< HTMLButtonElement >
) {
	const combinedField = view.layout?.combinedFields?.find(
		( f ) => f.id === fieldId
	);
	if ( !! combinedField ) {
		return combinedField.header;
	}
	const field = fields.find( ( f ) => f.id === fieldId );
	if ( ! field ) {
		return null;
	}
	const isHidable = field.enableHiding !== false;
	const isSortable = field.enableSorting !== false;
	const isSorted = view.sort?.field === field.id;
	const operators = sanitizeOperators( field );
	// Filter can be added:
	// 1. If the field is not already part of a view's filters.
	// 2. If the field meets the type and operator requirements.
	// 3. If it's not primary. If it is, it should be already visible.
	const canAddFilter =
		! view.filters?.some( ( _filter ) => field.id === _filter.field ) &&
		!! field.elements?.length &&
		!! operators.length &&
		! field.filterBy?.isPrimary;
	if ( ! isSortable && ! isHidable && ! canAddFilter ) {
		return field.header;
	}
	return (
		<DropdownMenu
			align="start"
			trigger={
				<Button
					size="compact"
					className="dataviews-view-table-header-button"
					ref={ ref }
					variant="tertiary"
				>
					{ field.header }
					{ view.sort && isSorted && (
						<span aria-hidden="true">
							{ sortArrows[ view.sort.direction ] }
						</span>
					) }
				</Button>
			}
			style={ { minWidth: '240px' } }
		>
			<WithDropDownMenuSeparators>
				{ isSortable && (
					<DropdownMenuGroup>
						{ SORTING_DIRECTIONS.map(
							( direction: SortDirection ) => {
								const isChecked =
									view.sort &&
									isSorted &&
									view.sort.direction === direction;

								const value = `${ field.id }-${ direction }`;

								return (
									<DropdownMenuRadioItem
										key={ value }
										// All sorting radio items share the same name, so that
										// selecting a sorting option automatically deselects the
										// previously selected one, even if it is displayed in
										// another submenu. The field and direction are passed via
										// the `value` prop.
										name="view-table-sorting"
										value={ value }
										checked={ isChecked }
										onChange={ () => {
											onChangeView( {
												...view,
												sort: {
													field: field.id,
													direction,
												},
											} );
										} }
									>
										<DropdownMenuItemLabel>
											{ sortLabels[ direction ] }
										</DropdownMenuItemLabel>
									</DropdownMenuRadioItem>
								);
							}
						) }
					</DropdownMenuGroup>
				) }
				{ canAddFilter && (
					<DropdownMenuGroup>
						<DropdownMenuItem
							prefix={ <Icon icon={ funnel } /> }
							onClick={ () => {
								setOpenedFilter( field.id );
								onChangeView( {
									...view,
									page: 1,
									filters: [
										...( view.filters || [] ),
										{
											field: field.id,
											value: undefined,
											operator: operators[ 0 ],
										},
									],
								} );
							} }
						>
							<DropdownMenuItemLabel>
								{ __( 'Add filter' ) }
							</DropdownMenuItemLabel>
						</DropdownMenuItem>
					</DropdownMenuGroup>
				) }
				{ isHidable && (
					<DropdownMenuItem
						prefix={ <Icon icon={ unseen } /> }
						onClick={ () => {
							const viewFields =
								view.fields || fields.map( ( f ) => f.id );
							onHide( field );
							onChangeView( {
								...view,
								fields: viewFields.filter(
									( id ) => id !== field.id
								),
							} );
						} }
					>
						<DropdownMenuItemLabel>
							{ __( 'Hide' ) }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
				) }
			</WithDropDownMenuSeparators>
		</DropdownMenu>
	);
} );

// @ts-expect-error Lift the `Item` type argument through the forwardRef.
const HeaderMenu: < Item >(
	props: PropsWithoutRef< HeaderMenuProps< Item > > &
		RefAttributes< HTMLButtonElement >
) => ReturnType< typeof _HeaderMenu > = _HeaderMenu;

function BulkSelectionCheckbox< Item >( {
	selection,
	onSelectionChange,
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
					onSelectionChange( [] );
				} else {
					onSelectionChange(
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
	const value = field.render( {
		item,
	} );
	return (
		!! value && (
			<div
				className={ clsx(
					'dataviews-view-table__cell-content-wrapper',
					{
						'dataviews-view-table__primary-field':
							primaryField?.id === field.id,
					}
				) }
			>
				{ value }
			</div>
		)
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
	onSelectionChange,
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
					onSelectionChange(
						selection.includes( id )
							? selection.filter( ( itemId ) => id !== itemId )
							: [ ...selection, id ]
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
							onSelectionChange={ onSelectionChange }
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
	onSelectionChange,
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
									onSelectionChange={ onSelectionChange }
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
									<HeaderMenu
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
								onSelectionChange={ onSelectionChange }
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
