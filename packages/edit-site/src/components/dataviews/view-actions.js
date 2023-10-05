/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	SelectControl,
	privateApis as componentsPrivateApis,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import {
	chevronRightSmall,
	check,
	blockTable,
	chevronDown,
	arrowUp,
	arrowDown,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	DropdownSubMenuV2,
	DropdownSubMenuTriggerV2,
} = unlock( componentsPrivateApis );

export const PAGE_SIZE_VALUES = [ 5, 20, 50 ];

export function PageSizeControl( { dataView } ) {
	const label = __( 'Rows per page:' );
	return (
		<SelectControl
			__nextHasNoMarginBottom
			label={ label }
			hideLabelFromVision
			// TODO: This should probably use a label based on the wanted design
			// and we could remove InputControlPrefixWrapper usage.
			prefix={
				<InputControlPrefixWrapper
					as="span"
					className="dataviews__per-page-control-prefix"
				>
					{ label }
				</InputControlPrefixWrapper>
			}
			value={ dataView.getState().pagination.pageSize }
			options={ PAGE_SIZE_VALUES.map( ( pageSize ) => ( {
				value: pageSize,
				label: pageSize,
			} ) ) }
			onChange={ ( value ) => dataView.setPageSize( +value ) }
		/>
	);
}

function PageSizeMenu( { dataView } ) {
	const currenPageSize = dataView.getState().pagination.pageSize;
	return (
		<DropdownSubMenuV2
			trigger={
				<DropdownSubMenuTriggerV2
					suffix={
						<>
							{ currenPageSize }
							<Icon icon={ chevronRightSmall } />
						</>
					}
				>
					{ /* TODO: probably label per view type. */ }
					{ __( 'Rows per page' ) }
				</DropdownSubMenuTriggerV2>
			}
		>
			{ PAGE_SIZE_VALUES.map( ( size ) => {
				return (
					<DropdownMenuItemV2
						key={ size }
						prefix={
							currenPageSize === size && <Icon icon={ check } />
						}
						onSelect={ ( event ) => {
							// We need to handle this on DropDown component probably..
							event.preventDefault();
							dataView.setPageSize( size );
						} }
						// TODO: check about role and a11y.
						role="menuitemcheckbox"
					>
						{ size }
					</DropdownMenuItemV2>
				);
			} ) }
		</DropdownSubMenuV2>
	);
}

function FieldsVisibilityMenu( { dataView } ) {
	const hideableFields = dataView
		.getAllColumns()
		.filter( ( columnn ) => columnn.getCanHide() );
	if ( ! hideableFields?.length ) {
		return null;
	}
	return (
		<DropdownSubMenuV2
			trigger={
				<DropdownSubMenuTriggerV2
					suffix={ <Icon icon={ chevronRightSmall } /> }
				>
					{ __( 'Fields' ) }
				</DropdownSubMenuTriggerV2>
			}
		>
			{ hideableFields?.map( ( field ) => {
				return (
					<DropdownMenuItemV2
						key={ field.id }
						prefix={
							field.getIsVisible() && <Icon icon={ check } />
						}
						onSelect={ ( event ) => {
							event.preventDefault();
							field.getToggleVisibilityHandler()( event );
						} }
						role="menuitemcheckbox"
					>
						{ field.columnDef.header }
					</DropdownMenuItemV2>
				);
			} ) }
		</DropdownSubMenuV2>
	);
}

// This object is used to construct the sorting options per sortable field.
const sortingItemsInfo = {
	asc: { icon: arrowUp, label: __( 'Sort ascending' ) },
	desc: { icon: arrowDown, label: __( 'Sort descending' ) },
};
function SortMenu( { dataView } ) {
	const sortableFields = dataView
		.getAllColumns()
		.filter( ( columnn ) => columnn.getCanSort() );
	if ( ! sortableFields?.length ) {
		return null;
	}
	const currentSortedField = sortableFields.find( ( field ) =>
		field.getIsSorted()
	);
	return (
		<DropdownSubMenuV2
			trigger={
				<DropdownSubMenuTriggerV2
					suffix={
						<>
							{ currentSortedField?.columnDef.header }
							<Icon icon={ chevronRightSmall } />
						</>
					}
				>
					{ __( 'Sort by' ) }
				</DropdownSubMenuTriggerV2>
			}
		>
			{ sortableFields?.map( ( field ) => {
				const sortedDirection = field.getIsSorted();
				return (
					<DropdownSubMenuV2
						key={ field.id }
						trigger={
							<DropdownSubMenuTriggerV2
								suffix={ <Icon icon={ chevronRightSmall } /> }
							>
								{ field.columnDef.header }
							</DropdownSubMenuTriggerV2>
						}
						side="left"
					>
						{ Object.entries( sortingItemsInfo ).map(
							( [ direction, info ] ) => {
								return (
									<DropdownMenuItemV2
										key={ direction }
										prefix={ <Icon icon={ info.icon } /> }
										suffix={
											sortedDirection === direction && (
												<Icon icon={ check } />
											)
										}
										onSelect={ ( event ) => {
											event.preventDefault();
											if (
												sortedDirection === direction
											) {
												dataView.resetSorting();
											} else {
												dataView.setSorting( [
													{
														id: field.id,
														desc:
															direction ===
															'desc',
													},
												] );
											}
										} }
									>
										{ info.label }
									</DropdownMenuItemV2>
								);
							}
						) }
					</DropdownSubMenuV2>
				);
			} ) }
		</DropdownSubMenuV2>
	);
}

export default function ViewActions( { dataView, className } ) {
	return (
		<DropdownMenuV2
			label={ __( 'Actions' ) }
			className={ className }
			trigger={
				<Button variant="tertiary" icon={ blockTable }>
					{ __( 'View' ) }
					<Icon icon={ chevronDown } />
				</Button>
			}
		>
			<DropdownMenuGroupV2>
				<SortMenu dataView={ dataView } />
				<FieldsVisibilityMenu dataView={ dataView } />
				<PageSizeMenu dataView={ dataView } />
			</DropdownMenuGroupV2>
		</DropdownMenuV2>
	);
}
