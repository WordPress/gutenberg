/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Dropdown,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	SelectControl,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	privateApis as componentsPrivateApis,
	BaseControl,
	Icon,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { memo, useContext, useMemo } from '@wordpress/element';
import { cog, check } from '@wordpress/icons';
import warning from '@wordpress/warning';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { SORTING_DIRECTIONS, sortIcons, sortLabels } from '../../constants';
import { VIEW_LAYOUTS } from '../../dataviews-layouts';
import type { NormalizedField, View } from '../../types';
import DataViewsContext from '../dataviews-context';
import InfiniteScrollToggle from './infinite-scroll-toggle';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

const DATAVIEWS_CONFIG_POPOVER_PROPS = {
	className: 'dataviews-config__popover',
	placement: 'bottom-end',
	offset: 9,
};

export function ViewTypeMenu() {
	const { view, onChangeView, defaultLayouts } =
		useContext( DataViewsContext );
	const availableLayouts = Object.keys( defaultLayouts );
	if ( availableLayouts.length <= 1 ) {
		return null;
	}
	const activeView = VIEW_LAYOUTS.find( ( v ) => view.type === v.type );
	return (
		<Menu>
			<Menu.TriggerButton
				render={
					<Button
						size="compact"
						icon={ activeView?.icon }
						label={ __( 'Layout' ) }
					/>
				}
			/>
			<Menu.Popover>
				{ availableLayouts.map( ( layout ) => {
					const config = VIEW_LAYOUTS.find(
						( v ) => v.type === layout
					);
					if ( ! config ) {
						return null;
					}
					return (
						<Menu.RadioItem
							key={ layout }
							value={ layout }
							name="view-actions-available-view"
							checked={ layout === view.type }
							hideOnClick
							onChange={ (
								e: ChangeEvent< HTMLInputElement >
							) => {
								switch ( e.target.value ) {
									case 'list':
									case 'grid':
									case 'table':
									case 'pickerGrid':
										const viewWithoutLayout = { ...view };
										if ( 'layout' in viewWithoutLayout ) {
											delete viewWithoutLayout.layout;
										}
										return onChangeView( {
											...viewWithoutLayout,
											type: e.target.value,
											...defaultLayouts[ e.target.value ],
										} as View );
								}
								warning( 'Invalid dataview' );
							} }
						>
							<Menu.ItemLabel>{ config.label }</Menu.ItemLabel>
						</Menu.RadioItem>
					);
				} ) }
			</Menu.Popover>
		</Menu>
	);
}

function SortFieldControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );
	const orderOptions = useMemo( () => {
		const sortableFields = fields.filter(
			( field ) => field.enableSorting !== false
		);
		return sortableFields.map( ( field ) => {
			return {
				label: field.label,
				value: field.id,
			};
		} );
	}, [ fields ] );

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Sort by' ) }
			value={ view.sort?.field }
			options={ orderOptions }
			onChange={ ( value: string ) => {
				onChangeView( {
					...view,
					sort: {
						direction: view?.sort?.direction || 'desc',
						field: value,
					},
					showLevels: false,
				} );
			} }
		/>
	);
}

function SortDirectionControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );

	const sortableFields = fields.filter(
		( field ) => field.enableSorting !== false
	);
	if ( sortableFields.length === 0 ) {
		return null;
	}

	let value = view.sort?.direction;
	if ( ! value && view.sort?.field ) {
		value = 'desc';
	}
	return (
		<ToggleGroupControl
			className="dataviews-view-config__sort-direction"
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			isBlock
			label={ __( 'Order' ) }
			value={ value }
			onChange={ ( newDirection ) => {
				if ( newDirection === 'asc' || newDirection === 'desc' ) {
					onChangeView( {
						...view,
						sort: {
							direction: newDirection,
							field:
								view.sort?.field ||
								// If there is no field assigned as the sorting field assign the first sortable field.
								fields.find(
									( field ) => field.enableSorting !== false
								)?.id ||
								'',
						},
						showLevels: false,
					} );
					return;
				}
				warning( 'Invalid direction' );
			} }
		>
			{ SORTING_DIRECTIONS.map( ( direction ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ direction }
						value={ direction }
						icon={ sortIcons[ direction ] }
						label={ sortLabels[ direction ] }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

function ItemsPerPageControl() {
	const { view, config, onChangeView } = useContext( DataViewsContext );
	const { infiniteScrollEnabled } = view;
	if (
		! config ||
		! config.perPageSizes ||
		config.perPageSizes.length < 2 ||
		config.perPageSizes.length > 6 ||
		infiniteScrollEnabled
	) {
		return null;
	}

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			isBlock
			label={ __( 'Items per page' ) }
			value={ view.perPage || 10 }
			disabled={ ! view?.sort?.field }
			onChange={ ( newItemsPerPage ) => {
				const newItemsPerPageNumber =
					typeof newItemsPerPage === 'number' ||
					newItemsPerPage === undefined
						? newItemsPerPage
						: parseInt( newItemsPerPage, 10 );
				onChangeView( {
					...view,
					perPage: newItemsPerPageNumber,
					page: 1,
				} );
			} }
		>
			{ config.perPageSizes.map( ( value ) => {
				return (
					<ToggleGroupControlOption
						key={ value }
						value={ value }
						label={ value.toString() }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

function FieldItem( {
	field,
	isVisible,
	onToggleVisibility,
}: {
	field: NormalizedField< any >;
	isVisible: boolean;
	onToggleVisibility?: () => void;
} ) {
	return (
		<Item onClick={ field.enableHiding ? onToggleVisibility : undefined }>
			<HStack expanded justify="flex-start" alignment="center">
				<div style={ { height: 24, width: 24 } }>
					{ isVisible && <Icon icon={ check } /> }
				</div>
				<span>{ field.label }</span>
			</HStack>
		</Item>
	);
}

function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

function FieldControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );

	const togglableFields = [
		view?.titleField,
		view?.mediaField,
		view?.descriptionField,
	].filter( Boolean );

	// Get all regular fields (non-locked) in their original order from fields prop
	const regularFields = fields.filter(
		( f ) =>
			! togglableFields.includes( f.id ) &&
			f.type !== 'media' &&
			f.enableHiding !== false
	);

	if ( ! regularFields?.length ) {
		return null;
	}
	const titleField = fields.find( ( f ) => f.id === view.titleField );
	const previewField = fields.find( ( f ) => f.id === view.mediaField );
	const descriptionField = fields.find(
		( f ) => f.id === view.descriptionField
	);

	const lockedFields = [
		{
			field: titleField,
			isVisibleFlag: 'showTitle',
		},
		{
			field: previewField,
			isVisibleFlag: 'showMedia',
		},
		{
			field: descriptionField,
			isVisibleFlag: 'showDescription',
		},
	].filter( ( { field } ) => isDefined( field ) );
	const visibleFieldIds = view.fields ?? [];
	const visibleRegularFieldsCount = regularFields.filter( ( f ) =>
		visibleFieldIds.includes( f.id )
	).length;

	let visibleLockedFields = lockedFields.filter(
		( { field, isVisibleFlag } ) =>
			// @ts-expect-error
			isDefined( field ) && ( view[ isVisibleFlag ] ?? true )
	) as Array< {
		field: NormalizedField< any >;
		isVisibleFlag: string;
	} >;

	// If only one field (locked or regular) is visible, prevent it from being hidden
	const totalVisibleFields =
		visibleLockedFields.length + visibleRegularFieldsCount;
	if ( totalVisibleFields === 1 ) {
		if ( visibleLockedFields.length === 1 ) {
			visibleLockedFields = visibleLockedFields.map( ( locked ) => ( {
				...locked,
				field: { ...locked.field, enableHiding: false },
			} ) );
		}
	}

	const hiddenLockedFields = lockedFields.filter(
		( { field, isVisibleFlag } ) =>
			// @ts-expect-error
			isDefined( field ) && ! ( view[ isVisibleFlag ] ?? true )
	) as Array< {
		field: NormalizedField< any >;
		isVisibleFlag: string;
	} >;

	return (
		<VStack className="dataviews-field-control" spacing={ 0 }>
			<BaseControl.VisualLabel>
				{ __( 'Properties' ) }
			</BaseControl.VisualLabel>
			<VStack className="dataviews-view-config__properties" spacing={ 0 }>
				<ItemGroup isBordered isSeparated size="medium">
					{ visibleLockedFields.map( ( { field, isVisibleFlag } ) => {
						return (
							<FieldItem
								key={ field.id }
								field={ field }
								isVisible
								onToggleVisibility={ () => {
									onChangeView( {
										...view,
										[ isVisibleFlag ]: false,
									} );
								} }
							/>
						);
					} ) }

					{ hiddenLockedFields.map( ( { field, isVisibleFlag } ) => {
						return (
							<FieldItem
								key={ field.id }
								field={ field }
								isVisible={ false }
								onToggleVisibility={ () => {
									onChangeView( {
										...view,
										[ isVisibleFlag ]: true,
									} );
								} }
							/>
						);
					} ) }

					{ regularFields.map( ( field ) => {
						// Check if this is the last visible field to prevent hiding
						const isVisible = visibleFieldIds.includes( field.id );
						const isLastVisible =
							totalVisibleFields === 1 && isVisible;
						const fieldToRender = isLastVisible
							? { ...field, enableHiding: false }
							: field;

						return (
							<FieldItem
								key={ field.id }
								field={ fieldToRender }
								isVisible={ isVisible }
								onToggleVisibility={ () => {
									onChangeView( {
										...view,
										fields: isVisible
											? visibleFieldIds.filter(
													( fieldId ) =>
														fieldId !== field.id
											  )
											: [ ...visibleFieldIds, field.id ],
									} );
								} }
							/>
						);
					} ) }
				</ItemGroup>
			</VStack>
		</VStack>
	);
}

function SettingsSection( {
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
} ) {
	return (
		<Grid columns={ 12 } className="dataviews-settings-section" gap={ 4 }>
			<div className="dataviews-settings-section__sidebar">
				<Heading
					level={ 2 }
					className="dataviews-settings-section__title"
				>
					{ title }
				</Heading>
				{ description && (
					<Text
						variant="muted"
						className="dataviews-settings-section__description"
					>
						{ description }
					</Text>
				) }
			</div>
			<Grid
				columns={ 8 }
				gap={ 4 }
				className="dataviews-settings-section__content"
			>
				{ children }
			</Grid>
		</Grid>
	);
}

export function DataviewsViewConfigDropdown() {
	const { view } = useContext( DataViewsContext );
	const popoverId = useInstanceId(
		_DataViewsViewConfig,
		'dataviews-view-config-dropdown'
	);
	const activeLayout = VIEW_LAYOUTS.find(
		( layout ) => layout.type === view.type
	);
	return (
		<Dropdown
			expandOnMobile
			popoverProps={ {
				...DATAVIEWS_CONFIG_POPOVER_PROPS,
				id: popoverId,
			} }
			renderToggle={ ( { onToggle, isOpen } ) => {
				return (
					<Button
						size="compact"
						icon={ cog }
						label={ _x( 'View options', 'View is used as a noun' ) }
						onClick={ onToggle }
						aria-expanded={ isOpen ? 'true' : 'false' }
						aria-controls={ popoverId }
					/>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper
					paddingSize="medium"
					className="dataviews-config__popover-content-wrapper"
				>
					<VStack className="dataviews-view-config" spacing={ 6 }>
						<SettingsSection title={ __( 'Appearance' ) }>
							<HStack expanded className="is-divided-in-two">
								<SortFieldControl />
								<SortDirectionControl />
							</HStack>
							{ !! activeLayout?.viewConfigOptions && (
								<activeLayout.viewConfigOptions />
							) }
							<InfiniteScrollToggle />
							<ItemsPerPageControl />
							<FieldControl />
						</SettingsSection>
					</VStack>
				</DropdownContentWrapper>
			) }
		/>
	);
}

function _DataViewsViewConfig() {
	return (
		<>
			<ViewTypeMenu />
			<DataviewsViewConfigDropdown />
		</>
	);
}

const DataViewsViewConfig = memo( _DataViewsViewConfig );

export default DataViewsViewConfig;
