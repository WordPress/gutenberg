/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';
import { unseen, check, arrowUp, arrowDown, funnel } from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Children, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import ItemActions from './item-actions';
import { ENUMERATION_TYPE, OPERATOR_IN, OPERATOR_NOT_IN } from './constants';

const {
	DropdownMenuV2Ariakit: DropdownMenu,
	DropdownMenuGroupV2Ariakit: DropdownMenuGroup,
	DropdownMenuItemV2Ariakit: DropdownMenuItem,
	DropdownMenuSeparatorV2Ariakit: DropdownMenuSeparator,
	DropdownMenuItemLabelV2Ariakit: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

const sortingItemsInfo = {
	asc: { icon: arrowUp, label: __( 'Sort ascending' ) },
	desc: { icon: arrowDown, label: __( 'Sort descending' ) },
};
const sortArrows = { asc: '↑', desc: '↓' };

const sanitizeOperators = ( field ) => {
	let operators = field.filterBy?.operators;
	if ( ! operators || ! Array.isArray( operators ) ) {
		operators = [ OPERATOR_IN, OPERATOR_NOT_IN ];
	}
	return operators.filter( ( operator ) =>
		[ OPERATOR_IN, OPERATOR_NOT_IN ].includes( operator )
	);
};

function HeaderMenu( { field, view, onChangeView } ) {
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
					className="dataviews-table-header-button"
					style={ { padding: 0 } }
				>
					{ field.header }
					{ isSorted && (
						<span aria-hidden="true">
							{ isSorted && sortArrows[ view.sort.direction ] }
						</span>
					) }
				</Button>
			}
		>
			<WithSeparators>
				{ isSortable && (
					<DropdownMenuGroup>
						{ Object.entries( sortingItemsInfo ).map(
							( [ direction, info ] ) => {
								const isChecked =
									isSorted &&
									view.sort.direction === direction;
								return (
									<DropdownMenuItem
										key={ direction }
										role="menuitemradio"
										aria-checked={ isChecked }
										prefix={ <Icon icon={ info.icon } /> }
										suffix={
											isChecked && <Icon icon={ check } />
										}
										onClick={ ( event ) => {
											event.preventDefault();
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
									</DropdownMenuItem>
								);
							}
						) }
					</DropdownMenuGroup>
				) }
				{ isHidable && (
					<DropdownMenuItem
						role="menuitemradio"
						aria-checked={ false }
						prefix={ <Icon icon={ unseen } /> }
						onClick={ ( event ) => {
							event.preventDefault();
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
										<>
											{ activeElement &&
												activeOperator ===
													OPERATOR_IN &&
												__( 'Is' ) }
											{ activeElement &&
												activeOperator ===
													OPERATOR_NOT_IN &&
												__( 'Is not' ) }
											{ activeElement && ' ' }
											{ activeElement?.label }
										</>
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
											<DropdownMenuItem
												key={ element.value }
												role="menuitemradio"
												aria-checked={ isActive }
												prefix={
													isActive && (
														<Icon icon={ check } />
													)
												}
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
											</DropdownMenuItem>
										);
									} ) }
								</DropdownMenuGroup>
								{ filter.operators.length > 1 && (
									<DropdownMenu
										trigger={
											<DropdownMenuItem
												suffix={
													<>
														{ activeOperator ===
															OPERATOR_IN &&
															__( 'Is' ) }
														{ activeOperator ===
															OPERATOR_NOT_IN &&
															__(
																'Is not'
															) }{ ' ' }
													</>
												}
											>
												<DropdownMenuItemLabel>
													{ __( 'Conditions' ) }
												</DropdownMenuItemLabel>
											</DropdownMenuItem>
										}
									>
										<DropdownMenuItem
											key="in-filter"
											role="menuitemradio"
											aria-checked={
												activeOperator === OPERATOR_IN
											}
											prefix={
												activeOperator ===
													OPERATOR_IN && (
													<Icon icon={ check } />
												)
											}
											onClick={ () =>
												onChangeView( {
													...view,
													page: 1,
													filters: [
														...otherFilters,
														{
															field: filter.field,
															operator:
																OPERATOR_IN,
															value: filterInView?.value,
														},
													],
												} )
											}
										>
											<DropdownMenuItemLabel>
												{ __( 'Is' ) }
											</DropdownMenuItemLabel>
										</DropdownMenuItem>
										<DropdownMenuItem
											key="not-in-filter"
											role="menuitemradio"
											aria-checked={
												activeOperator ===
												OPERATOR_NOT_IN
											}
											prefix={
												activeOperator ===
													OPERATOR_NOT_IN && (
													<Icon icon={ check } />
												)
											}
											onClick={ () =>
												onChangeView( {
													...view,
													page: 1,
													filters: [
														...otherFilters,
														{
															field: filter.field,
															operator:
																OPERATOR_NOT_IN,
															value: filterInView?.value,
														},
													],
												} )
											}
										>
											<DropdownMenuItemLabel>
												{ __( 'Is not' ) }
											</DropdownMenuItemLabel>
										</DropdownMenuItem>
									</DropdownMenu>
								) }
							</WithSeparators>
						</DropdownMenu>
					</DropdownMenuGroup>
				) }
			</WithSeparators>
		</DropdownMenu>
	);
}

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

function ViewTable( {
	view,
	onChangeView,
	fields,
	actions,
	data,
	getItemId,
	isLoading = false,
	deferredRendering,
} ) {
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			! [ view.layout.mediaField, view.layout.primaryField ].includes(
				field.id
			)
	);
	const shownData = useAsyncList( data );
	const usedData = deferredRendering ? shownData : data;
	const hasData = !! usedData?.length;
	if ( isLoading ) {
		// TODO:Add spinner or progress bar..
		return (
			<div className="dataviews-loading">
				<h3>{ __( 'Loading' ) }</h3>
			</div>
		);
	}
	const sortValues = { asc: 'ascending', desc: 'descending' };
	return (
		<div className="dataviews-table-view-wrapper">
			{ hasData && (
				<table className="dataviews-table-view">
					<thead>
						<tr>
							{ visibleFields.map( ( field ) => (
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
										field={ field }
										view={ view }
										onChangeView={ onChangeView }
									/>
								</th>
							) ) }
							{ !! actions?.length && (
								<th data-field-id="actions">
									{ __( 'Actions' ) }
								</th>
							) }
						</tr>
					</thead>
					<tbody>
						{ usedData.map( ( item ) => (
							<tr key={ getItemId( item ) }>
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
										{ field.render( {
											item,
										} ) }
									</td>
								) ) }
								{ !! actions?.length && (
									<td>
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
			) }
			{ ! hasData && (
				<div className="dataviews-no-results">
					<p>{ __( 'No results' ) }</p>
				</div>
			) }
		</div>
	);
}

export default ViewTable;
