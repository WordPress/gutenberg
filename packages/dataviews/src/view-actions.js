/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { VIEW_LAYOUTS, LAYOUT_TABLE, SORTING_DIRECTIONS } from './constants';
import { DropdownMenuRadioItemCustom } from './dropdown-menu-helper';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuCheckboxItemV2: DropdownMenuCheckboxItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
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
		<DropdownMenu
			trigger={
				<DropdownMenuItem
					suffix={
						<span aria-hidden="true">{ activeView.label }</span>
					}
				>
					<DropdownMenuItemLabel>
						{ __( 'Layout' ) }
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			}
		>
			{ _availableViews.map( ( availableView ) => {
				return (
					<DropdownMenuRadioItemCustom
						key={ availableView.type }
						value={ availableView.type }
						name="view-actions-available-view"
						checked={ availableView.type === view.type }
						hideOnClick={ true }
						onChange={ ( e ) => {
							onChangeView( {
								...view,
								type: e.target.value,
							} );
						} }
					>
						<DropdownMenuItemLabel>
							{ availableView.label }
						</DropdownMenuItemLabel>
					</DropdownMenuRadioItemCustom>
				);
			} ) }
		</DropdownMenu>
	);
}

const PAGE_SIZE_VALUES = [ 10, 20, 50, 100 ];
function PageSizeMenu( { view, onChangeView } ) {
	return (
		<DropdownMenu
			trigger={
				<DropdownMenuItem
					suffix={ <span aria-hidden="true">{ view.perPage }</span> }
				>
					<DropdownMenuItemLabel>
						{ /* TODO: probably label per view type. */ }
						{ __( 'Rows per page' ) }
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			}
		>
			{ PAGE_SIZE_VALUES.map( ( size ) => {
				return (
					<DropdownMenuRadioItemCustom
						key={ size }
						value={ size }
						name="view-actions-page-size"
						checked={ view.perPage === size }
						onChange={ ( e ) => {
							onChangeView( {
								...view,
								perPage: e.target.value,
								page: 1,
							} );
						} }
					>
						<DropdownMenuItemLabel>{ size }</DropdownMenuItemLabel>
					</DropdownMenuRadioItemCustom>
				);
			} ) }
		</DropdownMenu>
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
		<DropdownMenu
			trigger={
				<DropdownMenuItem>
					<DropdownMenuItemLabel>
						{ __( 'Fields' ) }
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			}
		>
			{ hidableFields?.map( ( field ) => {
				return (
					<DropdownMenuCheckboxItem
						key={ field.id }
						value={ field.id }
						checked={ ! view.hiddenFields?.includes( field.id ) }
						onChange={ () => {
							onChangeView( {
								...view,
								hiddenFields: view.hiddenFields?.includes(
									field.id
								)
									? view.hiddenFields.filter(
											( id ) => id !== field.id
									  )
									: [
											...( view.hiddenFields || [] ),
											field.id,
									  ],
							} );
						} }
					>
						<DropdownMenuItemLabel>
							{ field.header }
						</DropdownMenuItemLabel>
					</DropdownMenuCheckboxItem>
				);
			} ) }
		</DropdownMenu>
	);
}

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
		<DropdownMenu
			trigger={
				<DropdownMenuItem
					suffix={
						<span aria-hidden="true">
							{ currentSortedField?.header }
						</span>
					}
				>
					<DropdownMenuItemLabel>
						{ __( 'Sort by' ) }
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			}
		>
			{ sortableFields?.map( ( field ) => {
				const sortedDirection = view.sort?.direction;
				return (
					<DropdownMenu
						key={ field.id }
						trigger={
							<DropdownMenuItem>
								<DropdownMenuItemLabel>
									{ field.header }
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						}
						style={ {
							minWidth: '220px',
						} }
					>
						{ Object.entries( SORTING_DIRECTIONS ).map(
							( [ direction, info ] ) => {
								const isChecked =
									currentSortedField !== undefined &&
									sortedDirection === direction &&
									field.id === currentSortedField.id;

								return (
									<DropdownMenuRadioItemCustom
										key={ direction }
										value={ direction }
										name={ `view-actions-sorting-${ field.id }` }
										checked={ isChecked }
										onChange={ ( e ) => {
											onChangeView( {
												...view,
												sort: {
													field: field.id,
													direction: e.target.value,
												},
											} );
										} }
									>
										<DropdownMenuItemLabel>
											{ info.label }
										</DropdownMenuItemLabel>
									</DropdownMenuRadioItemCustom>
								);
							}
						) }
					</DropdownMenu>
				);
			} ) }
		</DropdownMenu>
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
				{ window?.__experimentalAdminViews && (
					<ViewTypeMenu
						view={ view }
						onChangeView={ onChangeView }
						supportedLayouts={ supportedLayouts }
					/>
				) }
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
