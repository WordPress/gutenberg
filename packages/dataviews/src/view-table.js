/**
 * External dependencies
 */
import clsx from 'clsx';

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
import SingleSelectionCheckbox from './single-selection-checkbox';
import { unlock } from './lock-unlock';
import ItemActions from './item-actions';
import { sanitizeOperators } from './utils';
import { SORTING_DIRECTIONS } from './constants';
import {
	useSomeItemHasAPossibleBulkAction,
	useHasAPossibleBulkAction,
} from './bulk-actions';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

function WithDropDownMenuSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}

const sortArrows = { asc: '↑', desc: '↓' };

const HeaderMenu = forwardRef( function HeaderMenu(
	{ field, view, onChangeView, onHide, setOpenedFilter },
	ref
) {
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
					{ isSorted && (
						<span aria-hidden="true">
							{ isSorted && sortArrows[ view.sort.direction ] }
						</span>
					) }
				</Button>
			}
			style={ { minWidth: '240px' } }
		>
			<WithDropDownMenuSeparators>
				{ isSortable && (
					<DropdownMenuGroup>
						{ Object.entries( SORTING_DIRECTIONS ).map(
							( [ direction, info ] ) => {
								const isChecked =
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
											{ info.label }
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
							onHide( field );
							onChangeView( {
								...view,
								hiddenFields: view.hiddenFields.concat(
									field.id
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

function BulkSelectionCheckbox( {
	selection,
	onSelectionChange,
	data,
	actions,
} ) {
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return actions.some(
				( action ) => action.supportsBulk && action.isEligible( item )
			);
		} );
	}, [ data, actions ] );
	const areAllSelected = selection.length === selectableItems.length;
	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			__nextHasNoMarginBottom
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && selection.length }
			onChange={ () => {
				if ( areAllSelected ) {
					onSelectionChange( [] );
				} else {
					onSelectionChange( selectableItems );
				}
			} }
			aria-label={
				areAllSelected ? __( 'Deselect all' ) : __( 'Select all' )
			}
		/>
	);
}

function TableRow( {
	hasBulkActions,
	item,
	actions,
	id,
	visibleFields,
	primaryField,
	selection,
	getItemId,
	onSelectionChange,
	data,
} ) {
	const hasPossibleBulkAction = useHasAPossibleBulkAction( actions, item );
	const isSelected = selection.includes( id );

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
				if (
					! isTouchDevice.current &&
					document.getSelection().type !== 'Range'
				) {
					if ( ! isSelected ) {
						onSelectionChange(
							data.filter( ( _item ) => {
								const itemId = getItemId?.( _item );
								return (
									itemId === id ||
									selection.includes( itemId )
								);
							} )
						);
					} else {
						onSelectionChange(
							data.filter( ( _item ) => {
								const itemId = getItemId?.( _item );
								return (
									itemId !== id &&
									selection.includes( itemId )
								);
							} )
						);
					}
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
							id={ id }
							item={ item }
							selection={ selection }
							onSelectionChange={ onSelectionChange }
							getItemId={ getItemId }
							data={ data }
							primaryField={ primaryField }
							disabled={ ! hasPossibleBulkAction }
						/>
					</div>
				</td>
			) }
			{ visibleFields.map( ( field ) => (
				<td
					key={ field.id }
					style={ {
						width: field.width || undefined,
						minWidth: field.minWidth || undefined,
						maxWidth: field.maxWidth || undefined,
					} }
				>
					<div
						className={ clsx(
							'dataviews-view-table__cell-content-wrapper',
							{
								'dataviews-view-table__primary-field':
									primaryField?.id === field.id,
							}
						) }
					>
						{ field.render( {
							item,
						} ) }
					</div>
				</td>
			) ) }
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

function ViewTable( {
	view,
	onChangeView,
	fields,
	actions,
	data,
	getItemId,
	isLoading = false,
	selection,
	onSelectionChange,
	setOpenedFilter,
} ) {
	const headerMenuRefs = useRef( new Map() );
	const headerMenuToFocusRef = useRef();
	const [ nextHeaderMenuToFocus, setNextHeaderMenuToFocus ] = useState();
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
		setNextHeaderMenuToFocus();
		return;
	}

	const onHide = ( field ) => {
		const hidden = headerMenuRefs.current.get( field.id );
		const fallback = headerMenuRefs.current.get( hidden.fallback );
		setNextHeaderMenuToFocus( fallback?.node );
	};
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			! [ view.layout.mediaField ].includes( field.id )
	);
	const hasData = !! data?.length;
	const sortValues = { asc: 'ascending', desc: 'descending' };

	const primaryField = fields.find(
		( field ) => field.id === view.layout.primaryField
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
								data-field-id="selection"
								scope="col"
							>
								<BulkSelectionCheckbox
									selection={ selection }
									onSelectionChange={ onSelectionChange }
									data={ data }
									actions={ actions }
								/>
							</th>
						) }
						{ visibleFields.map( ( field, index ) => (
							<th
								key={ field.id }
								style={ {
									width: field.width || undefined,
									minWidth: field.minWidth || undefined,
									maxWidth: field.maxWidth || undefined,
								} }
								data-field-id={ field.id }
								aria-sort={
									view.sort?.field === field.id &&
									sortValues[ view.sort.direction ]
								}
								scope="col"
							>
								<HeaderMenu
									ref={ ( node ) => {
										if ( node ) {
											headerMenuRefs.current.set(
												field.id,
												{
													node,
													fallback:
														visibleFields[
															index > 0
																? index - 1
																: 1
														]?.id,
												}
											);
										} else {
											headerMenuRefs.current.delete(
												field.id
											);
										}
									} }
									field={ field }
									view={ view }
									onChangeView={ onChangeView }
									onHide={ onHide }
									setOpenedFilter={ setOpenedFilter }
								/>
							</th>
						) ) }
						{ !! actions?.length && (
							<th
								data-field-id="actions"
								className="dataviews-view-table__actions-column"
							>
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
								id={ getItemId( item ) || index }
								visibleFields={ visibleFields }
								primaryField={ primaryField }
								selection={ selection }
								getItemId={ getItemId }
								onSelectionChange={ onSelectionChange }
								data={ data }
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
