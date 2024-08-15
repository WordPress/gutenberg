/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	Popover,
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
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { memo, useContext, useState, useMemo } from '@wordpress/element';
import { cog, seen, unseen } from '@wordpress/icons';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import {
	SORTING_DIRECTIONS,
	LAYOUT_GRID,
	sortIcons,
	sortLabels,
} from '../../constants';
import { VIEW_LAYOUTS, getMandatoryFields } from '../../dataviews-layouts';
import type { SupportedLayouts } from '../../types';
import DataViewsContext from '../dataviews-context';
import { unlock } from '../../lock-unlock';
import DensityPicker from '../../dataviews-layouts/grid/density-picker';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

interface ViewTypeMenuProps {
	defaultLayouts?: SupportedLayouts;
}

function ViewTypeMenu( {
	defaultLayouts = { list: {}, grid: {}, table: {} },
}: ViewTypeMenuProps ) {
	const { view, onChangeView } = useContext( DataViewsContext );
	const availableLayouts = Object.keys( defaultLayouts );
	if ( availableLayouts.length <= 1 ) {
		return null;
	}
	const activeView = VIEW_LAYOUTS.find( ( v ) => view.type === v.type );
	return (
		<DropdownMenu
			trigger={
				<Button
					size="compact"
					icon={ activeView?.icon }
					label={ __( 'Layout' ) }
				/>
			}
		>
			{ availableLayouts.map( ( layout ) => {
				const config = VIEW_LAYOUTS.find( ( v ) => v.type === layout );
				if ( ! config ) {
					return null;
				}
				return (
					<DropdownMenuRadioItem
						key={ layout }
						value={ layout }
						name="view-actions-available-view"
						checked={ layout === view.type }
						hideOnClick
						onChange={ ( e: ChangeEvent< HTMLInputElement > ) => {
							switch ( e.target.value ) {
								case 'list':
								case 'grid':
								case 'table':
									return onChangeView( {
										...view,
										type: e.target.value,
										...defaultLayouts[ e.target.value ],
									} );
							}
							warning( 'Invalid dataview' );
						} }
					>
						<DropdownMenuItemLabel>
							{ config.label }
						</DropdownMenuItemLabel>
					</DropdownMenuRadioItem>
				);
			} ) }
		</DropdownMenu>
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
				} );
			} }
		/>
	);
}

function SortDirectionControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );
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

const PAGE_SIZE_VALUES = [ 10, 20, 50, 100 ];
function ItemsPerPageControl() {
	const { view, onChangeView } = useContext( DataViewsContext );
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
			{ PAGE_SIZE_VALUES.map( ( value ) => {
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

function FieldControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );
	const mandatoryFields = getMandatoryFields( view );
	const hidableFields = fields.filter(
		( field ) =>
			field.enableHiding !== false &&
			! mandatoryFields.includes( field.id )
	);
	const viewFields = view.fields || fields.map( ( field ) => field.id );
	if ( ! hidableFields?.length ) {
		return null;
	}
	return (
		<ItemGroup isBordered isSeparated>
			{ hidableFields?.map( ( field ) => {
				const isVisible = viewFields.includes( field.id );
				return (
					<Item key={ field.id }>
						<HStack expanded>
							<span>{ field.label }</span>
							<Button
								size="compact"
								onClick={ () =>
									onChangeView( {
										...view,
										fields: isVisible
											? viewFields.filter(
													( id ) => id !== field.id
											  )
											: [ ...viewFields, field.id ],
									} )
								}
								icon={ isVisible ? seen : unseen }
								label={
									isVisible
										? __( 'Hide field' )
										: __( 'Show field' )
								}
							/>
						</HStack>
					</Item>
				);
			} ) }
		</ItemGroup>
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

function DataviewsViewConfigContent( {
	density,
	setDensity,
}: {
	density: number;
	setDensity: React.Dispatch< React.SetStateAction< number > >;
} ) {
	const { view } = useContext( DataViewsContext );
	return (
		<VStack className="dataviews-view-config" spacing={ 6 }>
			<SettingsSection title={ __( 'Appearance' ) }>
				<HStack expanded className="is-divided-in-two">
					<SortFieldControl />
					<SortDirectionControl />
				</HStack>
				{ view.type === LAYOUT_GRID && (
					<DensityPicker
						density={ density }
						setDensity={ setDensity }
					/>
				) }
				<ItemsPerPageControl />
			</SettingsSection>
			<SettingsSection title={ __( 'Properties' ) }>
				<FieldControl />
			</SettingsSection>
		</VStack>
	);
}

function _DataViewsViewConfig( {
	density,
	setDensity,
	defaultLayouts = { list: {}, grid: {}, table: {} },
}: {
	density: number;
	setDensity: React.Dispatch< React.SetStateAction< number > >;
	defaultLayouts?: SupportedLayouts;
} ) {
	const [ isShowingViewPopover, setIsShowingViewPopover ] =
		useState< boolean >( false );

	return (
		<>
			<ViewTypeMenu defaultLayouts={ defaultLayouts } />
			<div>
				<Button
					size="compact"
					icon={ cog }
					label={ _x( 'View options', 'View is used as a noun' ) }
					onClick={ () => setIsShowingViewPopover( true ) }
				/>
				{ isShowingViewPopover && (
					<Popover
						placement="bottom-end"
						onClose={ () => {
							setIsShowingViewPopover( false );
						} }
						focusOnMount
					>
						<DataviewsViewConfigContent
							density={ density }
							setDensity={ setDensity }
						/>
					</Popover>
				) }
			</div>
		</>
	);
}

const DataViewsViewConfig = memo( _DataViewsViewConfig );

export default DataViewsViewConfig;
