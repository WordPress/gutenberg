/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { chevronRightSmall, check, arrowUp, arrowDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { VIEW_LAYOUTS, LAYOUT_TABLE } from './constants';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownSubMenuV2: DropdownSubMenu,
	DropdownSubMenuTriggerV2: DropdownSubMenuTrigger,
} = unlock( componentsPrivateApis );

function ViewTypeMenu( { view, onChangeView, supportedLayouts } ) {
	let _availableViews = VIEW_LAYOUTS;
	if ( supportedLayouts ) {
		_availableViews = _availableViews.filter( ( _view ) =>
			supportedLayouts.includes( _view.type )
		);
	}
	if ( _availableViews.length === 1 ) {
		return null;
	}
	const activeView = _availableViews.find( ( v ) => view.type === v.type );
	return (
		<DropdownSubMenu
			trigger={
				<DropdownSubMenuTrigger
					suffix={
						<>
							{ activeView.label }
							<Icon icon={ chevronRightSmall } />
						</>
					}
				>
					{ __( 'Layout' ) }
				</DropdownSubMenuTrigger>
			}
		>
			{ _availableViews.map( ( availableView ) => {
				return (
					<DropdownMenuItem
						key={ availableView.type }
						role="menuitemradio"
						aria-checked={ availableView.id === view.type }
						prefix={
							availableView.type === view.type && (
								<Icon icon={ check } />
							)
						}
						onSelect={ ( event ) => {
							// We need to handle this on DropDown component probably..
							event.preventDefault();
							onChangeView( {
								...view,
								type: availableView.type,
							} );
						} }
					>
						{ availableView.label }
					</DropdownMenuItem>
				);
			} ) }
		</DropdownSubMenu>
	);
}

const PAGE_SIZE_VALUES = [ 10, 20, 50, 100 ];
function PageSizeMenu( { view, onChangeView } ) {
	return (
		<DropdownSubMenu
			trigger={
				<DropdownSubMenuTrigger
					suffix={
						<>
							{ view.perPage }
							<Icon icon={ chevronRightSmall } />
						</>
					}
				>
					{ /* TODO: probably label per view type. */ }
					{ __( 'Rows per page' ) }
				</DropdownSubMenuTrigger>
			}
		>
			{ PAGE_SIZE_VALUES.map( ( size ) => {
				return (
					<DropdownMenuItem
						key={ size }
						role="menuitemradio"
						aria-checked={ view.perPage === size }
						prefix={
							view.perPage === size && <Icon icon={ check } />
						}
						onSelect={ ( event ) => {
							// We need to handle this on DropDown component probably..
							event.preventDefault();
							onChangeView( { ...view, perPage: size, page: 1 } );
						} }
					>
						{ size }
					</DropdownMenuItem>
				);
			} ) }
		</DropdownSubMenu>
	);
}

function FieldsVisibilityMenu( { view, onChangeView, fields } ) {
	const hidableFields = fields.filter(
		( field ) =>
			field.enableHiding !== false && field.id !== view.layout.mediaField
	);
	if ( ! hidableFields?.length ) {
		return null;
	}
	return (
		<DropdownSubMenu
			trigger={
				<DropdownSubMenuTrigger
					suffix={ <Icon icon={ chevronRightSmall } /> }
				>
					{ __( 'Fields' ) }
				</DropdownSubMenuTrigger>
			}
		>
			{ hidableFields?.map( ( field ) => {
				return (
					<DropdownMenuItem
						key={ field.id }
						role="menuitemcheckbox"
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
					>
						{ field.header }
					</DropdownMenuItem>
				);
			} ) }
		</DropdownSubMenu>
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
		<DropdownSubMenu
			trigger={
				<DropdownSubMenuTrigger
					suffix={
						<>
							{ currentSortedField?.header }
							<Icon icon={ chevronRightSmall } />
						</>
					}
				>
					{ __( 'Sort by' ) }
				</DropdownSubMenuTrigger>
			}
		>
			{ sortableFields?.map( ( field ) => {
				const sortedDirection = view.sort?.direction;
				return (
					<DropdownSubMenu
						key={ field.id }
						trigger={
							<DropdownSubMenuTrigger
								suffix={ <Icon icon={ chevronRightSmall } /> }
							>
								{ field.header }
							</DropdownSubMenuTrigger>
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
									<DropdownMenuItem
										key={ direction }
										role="menuitemradio"
										aria-checked={ isActive }
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
									</DropdownMenuItem>
								);
							}
						) }
					</DropdownSubMenu>
				);
			} ) }
		</DropdownSubMenu>
	);
}

export default function ViewActions( {
	fields,
	view,
	onChangeView,
	supportedLayouts,
} ) {
	return (
		<DropdownMenu
			trigger={
				<Button
					variant="tertiary"
					size="compact"
					icon={
						VIEW_LAYOUTS.find( ( v ) => v.type === view.type )
							?.icon ||
						VIEW_LAYOUTS.find( ( v ) => v.type === LAYOUT_TABLE )
							.icon
					}
					label={ __( 'View options' ) }
				/>
			}
		>
			<DropdownMenuGroup>
				<ViewTypeMenu
					view={ view }
					onChangeView={ onChangeView }
					supportedLayouts={ supportedLayouts }
				/>
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
			</DropdownMenuGroup>
		</DropdownMenu>
	);
}
