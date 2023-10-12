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

function PageSizeMenu( { view, onChangeView } ) {
	return (
		<DropdownSubMenuV2
			trigger={
				<DropdownSubMenuTriggerV2
					suffix={
						<>
							{ view.perPage }
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
							view.perPage === size && <Icon icon={ check } />
						}
						onSelect={ ( event ) => {
							// We need to handle this on DropDown component probably..
							event.preventDefault();
							onChangeView( { ...view, perPage: size, page: 0 } );
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

function FieldsVisibilityMenu( { view, onChangeView, fields } ) {
	const hidableFields = fields.filter(
		( field ) => field.enableHiding !== false
	);
	if ( ! hidableFields?.length ) {
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
			{ hidableFields?.map( ( field ) => {
				return (
					<DropdownMenuItemV2
						key={ field.id }
						prefix={
							! view.hiddenFields?.includes( field.id ) && (
								<Icon icon={ check } />
							)
						}
						onSelect={ ( event ) => {
							event.preventDefault();
							onChangeView( {
								...view,
								hiddenFields: view.hiddenFields?.includes(
									field.id
								)
									? view.hiddenFields.filter(
											( id ) => id !== field.id
									  )
									: [ ...view.hiddenFields, field.id ],
							} );
						} }
						role="menuitemcheckbox"
					>
						{ field.header }
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
function SortMenu( { fields, view, onChangeView } ) {
	const sortableFields = fields.filter(
		( field ) => field.enableSorting !== false
	);
	if ( ! sortableFields?.length ) {
		return null;
	}
	const currentSortedField = fields.find(
		( field ) => field.id === view.sort?.field
	);
	return (
		<DropdownSubMenuV2
			trigger={
				<DropdownSubMenuTriggerV2
					suffix={
						<>
							{ currentSortedField?.header }
							<Icon icon={ chevronRightSmall } />
						</>
					}
				>
					{ __( 'Sort by' ) }
				</DropdownSubMenuTriggerV2>
			}
		>
			{ sortableFields?.map( ( field ) => {
				const sortedDirection = view.sort?.direction;
				return (
					<DropdownSubMenuV2
						key={ field.id }
						trigger={
							<DropdownSubMenuTriggerV2
								suffix={ <Icon icon={ chevronRightSmall } /> }
							>
								{ field.header }
							</DropdownSubMenuTriggerV2>
						}
						side="left"
					>
						{ Object.entries( sortingItemsInfo ).map(
							( [ direction, info ] ) => {
								const isActive =
									currentSortedField &&
									sortedDirection === direction &&
									field.id === currentSortedField.id;
								return (
									<DropdownMenuItemV2
										key={ direction }
										prefix={ <Icon icon={ info.icon } /> }
										suffix={
											isActive && <Icon icon={ check } />
										}
										onSelect={ ( event ) => {
											event.preventDefault();
											if (
												sortedDirection === direction
											) {
												onChangeView( {
													...view,
													sort: undefined,
												} );
											} else {
												onChangeView( {
													...view,
													sort: {
														field: field.id,
														direction,
													},
												} );
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

export default function ViewActions( { fields, view, onChangeView } ) {
	return (
		<DropdownMenuV2
			label={ __( 'Actions' ) }
			trigger={
				<Button variant="tertiary" icon={ blockTable }>
					{ __( 'View' ) }
					<Icon icon={ chevronDown } />
				</Button>
			}
		>
			<DropdownMenuGroupV2>
				<SortMenu
					fields={ fields }
					view={ view }
					onChangeView={ onChangeView }
				/>
				<FieldsVisibilityMenu
					fields={ fields }
					view={ view }
					onChangeView={ onChangeView }
				/>
				<PageSizeMenu view={ view } onChangeView={ onChangeView } />
			</DropdownMenuGroupV2>
		</DropdownMenuV2>
	);
}
