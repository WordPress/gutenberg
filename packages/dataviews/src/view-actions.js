/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { arrowUp, arrowDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { VIEW_LAYOUTS, LAYOUT_TABLE } from './constants';

const {
	DropdownMenuV2Ariakit: DropdownMenu,
	DropdownMenuGroupV2Ariakit: DropdownMenuGroup,
	DropdownMenuItemV2Ariakit: DropdownMenuItem,
	DropdownMenuRadioItemV2Ariakit: DropdownMenuRadioItem,
	DropdownMenuCheckboxItemV2Ariakit: DropdownMenuCheckboxItem,
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
				<DropdownMenuItem suffix={ activeView.label }>
					{ __( 'Layout' ) }
				</DropdownMenuItem>
			}
			placement="left-start"
		>
			{ _availableViews.map( ( availableView ) => {
				return (
					<DropdownMenuRadioItem
						key={ availableView.type }
						value={ availableView.type }
						name="view-actions-available-view"
						checked={ availableView.type === view.type }
						onChange={ () => {
							onChangeView( {
								...view,
								type: availableView.type,
							} );
						} }
					>
						{ availableView.label }
					</DropdownMenuRadioItem>
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
				<DropdownMenuItem suffix={ view.perPage }>
					{ /* TODO: probably label per view type. */ }
					{ __( 'Rows per page' ) }
				</DropdownMenuItem>
			}
			placement="left-start"
		>
			{ PAGE_SIZE_VALUES.map( ( size ) => {
				return (
					<DropdownMenuRadioItem
						key={ size }
						value={ size }
						name="view-actions-page-size"
						checked={ view.perPage === size }
						onChange={ () => {
							onChangeView( { ...view, perPage: size, page: 1 } );
						} }
					>
						{ size }
					</DropdownMenuRadioItem>
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
			trigger={ <DropdownMenuItem>{ __( 'Fields' ) }</DropdownMenuItem> }
			placement="left-start"
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
						{ field.header }
					</DropdownMenuCheckboxItem>
				);
			} ) }
		</DropdownMenu>
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
		<DropdownMenu
			trigger={
				<DropdownMenuItem suffix={ currentSortedField?.header }>
					{ __( 'Sort by' ) }
				</DropdownMenuItem>
			}
			placement="left-start"
		>
			{ sortableFields?.map( ( field ) => {
				const sortedDirection = view.sort?.direction;
				return (
					<DropdownMenu
						key={ field.id }
						trigger={
							<DropdownMenuItem>
								{ field.header }
							</DropdownMenuItem>
						}
						placement="left-start"
					>
						{ Object.entries( sortingItemsInfo ).map(
							( [ direction, info ] ) => {
								const isChecked =
									currentSortedField !== undefined &&
									sortedDirection === direction &&
									field.id === currentSortedField.id;

								return (
									<DropdownMenuRadioItem
										key={ direction }
										value={ direction }
										name={ `view-actions-sorting-${ field.id }` }
										suffix={ <Icon icon={ info.icon } /> }
										// Note: there is currently a limitation from the DropdownMenu
										// component where the radio won't unselect when all related
										// radios are set to false.
										checked={ isActive }
										onChange={ ( event ) => {
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
										{ info.label }
									</DropdownMenuRadioItem>
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
