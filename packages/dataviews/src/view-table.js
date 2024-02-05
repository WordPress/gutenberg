/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';
import { unseen, funnel } from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
	CheckboxControl,
} from '@wordpress/components';
import {
	Children,
	Fragment,
	forwardRef,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import ItemActions from './item-actions';
import { ENUMERATION_TYPE, OPERATORS, SORTING_DIRECTIONS } from './constants';
import { DropdownMenuRadioItemCustom } from './dropdown-menu-helper';
import SingleSelectionCheckbox from './single-selection-checkbox';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuItemHelpTextV2: DropdownMenuItemHelpText,
} = unlock( componentsPrivateApis );

const sortArrows = { asc: '↑', desc: '↓' };

const sanitizeOperators = ( field ) => {
	let operators = field.filterBy?.operators;
	if ( ! operators || ! Array.isArray( operators ) ) {
		operators = Object.keys( OPERATORS );
	}
	return operators.filter( ( operator ) =>
		Object.keys( OPERATORS ).includes( operator )
	);
};

const HeaderMenu = forwardRef( function HeaderMenu(
	{ field, view, onChangeView, onHide },
	ref
) {
	const isHidable = field.enableHiding !== false;

	const isSortable = field.enableSorting !== false;
	const isSorted = view.sort?.field === field.id;

	let filter, filterInView, activeElement, activeOperator, otherFilters;
	const operators = sanitizeOperators( field );
	if ( field.type === ENUMERATION_TYPE && operators.length > 0 ) {
		filter = {
			field: field.id,
			operators,
			elements: field.elements || [],
		};
		filterInView = view.filters.find( ( f ) => f.field === filter.field );
		otherFilters = view.filters.filter( ( f ) => f.field !== filter.field );
		activeElement = filter.elements.find(
			( element ) => element.value === filterInView?.value
		);
		activeOperator = filterInView?.operator || filter.operators[ 0 ];
	}
	const isFilterable = !! filter;

	if ( ! isSortable && ! isHidable && ! isFilterable ) {
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
			<WithSeparators>
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
				{ isFilterable && (
					<DropdownMenuGroup>
						<DropdownMenu
							key={ filter.field }
							trigger={
								<DropdownMenuItem
									prefix={ <Icon icon={ funnel } /> }
									suffix={
										activeElement && (
											<span aria-hidden="true">
												{ activeOperator in OPERATORS &&
													`${ OPERATORS[ activeOperator ].label } ` }
												{ activeElement?.label }
											</span>
										)
									}
								>
									<DropdownMenuItemLabel>
										{ __( 'Filter by' ) }
									</DropdownMenuItemLabel>
								</DropdownMenuItem>
							}
						>
							<WithSeparators>
								<DropdownMenuGroup>
									{ filter.elements.map( ( element ) => {
										const isActive =
											activeElement?.value ===
											element.value;
										return (
											<DropdownMenuRadioItemCustom
												key={ element.value }
												name={ `view-table-${ filter.field }` }
												value={ element.value }
												checked={ isActive }
												onClick={ () => {
													onChangeView( {
														...view,
														page: 1,
														filters: [
															...otherFilters,
															{
																field: filter.field,
																operator:
																	activeOperator,
																value: isActive
																	? undefined
																	: element.value,
															},
														],
													} );
												} }
											>
												<DropdownMenuItemLabel>
													{ element.label }
												</DropdownMenuItemLabel>
												{ !! element.description && (
													<DropdownMenuItemHelpText>
														{ element.description }
													</DropdownMenuItemHelpText>
												) }
											</DropdownMenuRadioItemCustom>
										);
									} ) }
								</DropdownMenuGroup>
								{ filter.operators.length > 1 && (
									<DropdownMenu
										trigger={
											<DropdownMenuItem
												suffix={
													<span aria-hidden="true">
														{
															OPERATORS[
																activeOperator
															]?.label
														}
													</span>
												}
											>
												<DropdownMenuItemLabel>
													{ __( 'Conditions' ) }
												</DropdownMenuItemLabel>
											</DropdownMenuItem>
										}
									>
										{ Object.entries( OPERATORS ).map(
											( [
												operator,
												{ label, key },
											] ) => (
												<DropdownMenuRadioItem
													key={ key }
													name={ `view-table-${ filter.field }-conditions` }
													value={ operator }
													checked={
														activeOperator ===
														operator
													}
													onChange={ ( e ) =>
														onChangeView( {
															...view,
															page: 1,
															filters: [
																...otherFilters,
																{
																	field: filter.field,
																	operator:
																		e.target
																			.value,
																	value: filterInView?.value,
																},
															],
														} )
													}
												>
													<DropdownMenuItemLabel>
														{ label }
													</DropdownMenuItemLabel>
												</DropdownMenuRadioItem>
											)
										) }
									</DropdownMenu>
								) }
							</WithSeparators>
						</DropdownMenu>
					</DropdownMenuGroup>
				) }
			</WithSeparators>
		</DropdownMenu>
	);
} );

function WithSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}

function BulkSelectionCheckbox( { selection, onSelectionChange, data } ) {
	const areAllSelected = selection.length === data.length;
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
					onSelectionChange( data );
				}
			} }
			label={ areAllSelected ? __( 'Deselect all' ) : __( 'Select all' ) }
		/>
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
	deferredRendering,
	selection,
	onSelectionChange,
} ) {
	const hasBulkActions = actions?.some( ( action ) => action.supportsBulk );
	const headerMenuRefs = useRef( new Map() );
	const headerMenuToFocusRef = useRef();
	const [ nextHeaderMenuToFocus, setNextHeaderMenuToFocus ] = useState();

	useEffect( () => {
		if ( headerMenuToFocusRef.current ) {
			headerMenuToFocusRef.current.focus();
			headerMenuToFocusRef.current = undefined;
		}
	} );

	const asyncData = useAsyncList( data );
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
	const usedData = deferredRendering ? asyncData : data;
	const hasData = !! usedData?.length;
	const sortValues = { asc: 'ascending', desc: 'descending' };

	const primaryField = fields.find(
		( field ) => field.id === view.layout.primaryField
	);

	return (
		<div className="dataviews-view-table-wrapper">
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
									width: 20,
									minWidth: 20,
								} }
								data-field-id="selection"
								scope="col"
							>
								<BulkSelectionCheckbox
									selection={ selection }
									onSelectionChange={ onSelectionChange }
									data={ data }
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
						usedData.map( ( item, index ) => (
							<tr
								key={ getItemId( item ) }
								className={ classnames(
									'dataviews-view-table__row',
									{
										'is-selected': selection.includes(
											getItemId( item ) || index
										),
									}
								) }
							>
								{ hasBulkActions && (
									<td
										className="dataviews-view-table__checkbox-column"
										style={ {
											width: 20,
											minWidth: 20,
										} }
									>
										<div className="dataviews-view-table__cell-content-wrapper">
											<SingleSelectionCheckbox
												id={
													getItemId( item ) || index
												}
												item={ item }
												selection={ selection }
												onSelectionChange={
													onSelectionChange
												}
												getItemId={ getItemId }
												data={ data }
												primaryField={ primaryField }
											/>
										</div>
									</td>
								) }
								{ visibleFields.map( ( field ) => (
									<td
										key={ field.id }
										style={ {
											width: field.width || undefined,
											minWidth:
												field.minWidth || undefined,
											maxWidth:
												field.maxWidth || undefined,
										} }
									>
										<div
											className={ classnames(
												'dataviews-view-table__cell-content-wrapper',
												{
													'dataviews-view-table__primary-field':
														primaryField?.id ===
														field.id,
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
									<td className="dataviews-view-table__actions-column">
										<ItemActions
											item={ item }
											actions={ actions }
										/>
									</td>
								) }
							</tr>
						) ) }
				</tbody>
			</table>
			<div
				className={ classnames( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! hasData && ! isLoading,
				} ) }
				id={ tableNoticeId }
			>
				{ ! hasData && (
					<p>{ isLoading ? __( 'Loading…' ) : __( 'No results' ) }</p>
				) }
			</div>
		</div>
	);
}

export default ViewTable;
