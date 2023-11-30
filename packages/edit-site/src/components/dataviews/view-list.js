/**
 * Internal dependencies
 */
import ViewTable from './view-table';

<<<<<<< HEAD
export default function ViewList( props ) {
	// To do: change to email-like preview list.
	return <ViewTable { ...props } />;
=======
const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownSubMenuV2: DropdownSubMenu,
	DropdownSubMenuTriggerV2: DropdownSubMenuTrigger,
} = unlock( componentsPrivateApis );

const EMPTY_OBJECT = {};
const sortingItemsInfo = {
	asc: { icon: arrowUp, label: __( 'Sort ascending' ) },
	desc: { icon: arrowDown, label: __( 'Sort descending' ) },
};
const sortIcons = { asc: chevronUp, desc: chevronDown };

function HeaderMenu( { dataView, header } ) {
	if ( header.isPlaceholder ) {
		return null;
	}
	const text = flexRender(
		header.column.columnDef.header,
		header.getContext()
	);
	const isSortable = !! header.column.getCanSort();
	const isHidable = !! header.column.getCanHide();
	if ( ! isSortable && ! isHidable ) {
		return text;
	}
	const sortedDirection = header.column.getIsSorted();

	let filter;
	if ( header.column.columnDef.type === ENUMERATION_TYPE ) {
		filter = {
			field: header.column.columnDef.id,
			elements: header.column.columnDef.elements || [],
		};
	}
	const isFilterable = !! filter;

	return (
		<DropdownMenu
			align="start"
			trigger={
				<Button
					icon={ sortIcons[ header.column.getIsSorted() ] }
					iconPosition="right"
					text={ text }
					style={ { padding: 0 } }
				/>
			}
		>
			<WithSeparators>
				{ isSortable && (
					<DropdownMenuGroup>
						{ Object.entries( sortingItemsInfo ).map(
							( [ direction, info ] ) => (
								<DropdownMenuItem
									key={ direction }
									role="menuitemradio"
									prefix={ <Icon icon={ info.icon } /> }
									suffix={
										sortedDirection === direction && (
											<Icon icon={ check } />
										)
									}
									onSelect={ ( event ) => {
										event.preventDefault();
										if ( sortedDirection === direction ) {
											dataView.resetSorting();
										} else {
											dataView.setSorting( [
												{
													id: header.column.id,
													desc: direction === 'desc',
												},
											] );
										}
									} }
								>
									{ info.label }
								</DropdownMenuItem>
							)
						) }
					</DropdownMenuGroup>
				) }
				{ isHidable && (
					<DropdownMenuItem
						prefix={ <Icon icon={ unseen } /> }
						role="menuitemradio"
						onSelect={ ( event ) => {
							event.preventDefault();
							header.column.getToggleVisibilityHandler()( event );
						} }
					>
						{ __( 'Hide' ) }
					</DropdownMenuItem>
				) }
				{ isFilterable && (
					<DropdownMenuGroup>
						<DropdownSubMenu
							key={ filter.field }
							trigger={
								<DropdownSubMenuTrigger
									prefix={ <Icon icon={ funnel } /> }
									suffix={
										<Icon icon={ chevronRightSmall } />
									}
								>
									{ __( 'Filter by' ) }
								</DropdownSubMenuTrigger>
							}
						>
							{ filter.elements.map( ( element ) => {
								let isActive = false;
								const columnFilters =
									dataView.getState().columnFilters;
								const columnFilter = columnFilters.find(
									( f ) =>
										Object.keys( f )[ 0 ].split(
											':'
										)[ 0 ] === filter.field
								);

								if ( columnFilter ) {
									const value =
										Object.values( columnFilter )[ 0 ];
									// Intentionally use loose comparison, so it does type conversion.
									// This covers the case where a top-level filter for the same field converts a number into a string.
									isActive = element.value == value; // eslint-disable-line eqeqeq
								}

								return (
									<DropdownMenuItem
										key={ element.value }
										role="menuitemradio"
										suffix={
											isActive && <Icon icon={ check } />
										}
										onSelect={ () => {
											const otherFilters =
												columnFilters?.filter(
													( f ) => {
														const [
															field,
															operator,
														] =
															Object.keys(
																f
															)[ 0 ].split( ':' );
														return (
															field !==
																filter.field ||
															operator !==
																OPERATOR_IN
														);
													}
												);

											dataView.setColumnFilters( [
												...otherFilters,
												{
													[ filter.field + ':in' ]:
														isActive
															? undefined
															: element.value,
												},
											] );
										} }
									>
										{ element.label }
									</DropdownMenuItem>
								);
							} ) }
						</DropdownSubMenu>
					</DropdownMenuGroup>
				) }
			</WithSeparators>
		</DropdownMenu>
	);
>>>>>>> 5058638126 (Set proper semantics (menuitemradio/menuitemcheckbox) in dropdown items)
}
