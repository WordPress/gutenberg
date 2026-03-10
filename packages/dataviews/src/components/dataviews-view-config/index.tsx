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
	__experimentalHeading as Heading,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { memo, useContext, useMemo } from '@wordpress/element';
import { cog } from '@wordpress/icons';
import warning from '@wordpress/warning';
import { useInstanceId } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { SORTING_DIRECTIONS, sortIcons, sortLabels } from '../../constants';
import { VIEW_LAYOUTS } from '../dataviews-layouts';
import type { View } from '../../types';
import DataViewsContext from '../dataviews-context';
import InfiniteScrollToggle from './infinite-scroll-toggle';
import { PropertiesSection } from './properties-section';
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
									case 'pickerTable':
									case 'activity':
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

function ResetViewButton() {
	const { onReset } = useContext( DataViewsContext );

	// Don't render if no persistence support (onReset is undefined)
	if ( onReset === undefined ) {
		return null;
	}

	const isDisabled = onReset === false;

	return (
		<Button
			variant="tertiary"
			size="compact"
			disabled={ isDisabled }
			accessibleWhenDisabled
			className="dataviews-view-config__reset-button"
			onClick={ () => {
				if ( typeof onReset === 'function' ) {
					onReset();
				}
			} }
		>
			{ __( 'Reset view' ) }
		</Button>
	);
}

export function DataviewsViewConfigDropdown() {
	const { view, onReset } = useContext( DataViewsContext );
	const popoverId = useInstanceId(
		_DataViewsViewConfig,
		'dataviews-view-config-dropdown'
	);
	const activeLayout = VIEW_LAYOUTS.find(
		( layout ) => layout.type === view.type
	);
	const isModified = typeof onReset === 'function';
	return (
		<Dropdown
			expandOnMobile
			popoverProps={ {
				...DATAVIEWS_CONFIG_POPOVER_PROPS,
				id: popoverId,
			} }
			renderToggle={ ( { onToggle, isOpen } ) => {
				return (
					<div className="dataviews-view-config__toggle-wrapper">
						<Button
							size="compact"
							icon={ cog }
							label={ _x(
								'View options',
								'View is used as a noun'
							) }
							onClick={ onToggle }
							aria-expanded={ isOpen ? 'true' : 'false' }
							aria-controls={ popoverId }
						/>
						{ isModified && (
							<span className="dataviews-view-config__modified-indicator" />
						) }
					</div>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper
					paddingSize="medium"
					className="dataviews-config__popover-content-wrapper"
				>
					<Stack
						direction="column"
						className="dataviews-view-config"
						gap="xl"
					>
						<Stack
							direction="row"
							justify="space-between"
							align="center"
							className="dataviews-view-config__header"
						>
							<Heading
								level={ 2 }
								className="dataviews-settings-section__title"
							>
								{ __( 'Appearance' ) }
							</Heading>
							<ResetViewButton />
						</Stack>
						<Stack direction="column" gap="lg">
							<Stack
								direction="row"
								gap="sm"
								className="dataviews-view-config__sort-controls"
							>
								<SortFieldControl />
								<SortDirectionControl />
							</Stack>
							{ !! activeLayout?.viewConfigOptions && (
								<activeLayout.viewConfigOptions />
							) }
							<InfiniteScrollToggle />
							<ItemsPerPageControl />
							<PropertiesSection />
						</Stack>
					</Stack>
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
