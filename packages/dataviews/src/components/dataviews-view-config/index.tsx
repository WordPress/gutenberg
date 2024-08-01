/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Popover,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	SelectControl,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { memo, useContext, useState, useMemo } from '@wordpress/element';
import { cog, seen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { SORTING_DIRECTIONS, sortLabelsShort } from '../../constants';
import { VIEW_LAYOUTS, getMandatoryFields } from '../../dataviews-layouts';
import type { SupportedLayouts } from '../../types';
import DataViewsContext from '../dataviews-context';

interface ViewActionsProps {
	defaultLayouts?: SupportedLayouts;
}

function LayoutPicker( {
	defaultLayouts = { list: {}, grid: {}, table: {} },
}: ViewActionsProps ) {
	const { view, onChangeView } = useContext( DataViewsContext );
	const availableLayouts = Object.keys( defaultLayouts );
	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			isBlock
			label={ __( 'Layout' ) }
			value={ view.type }
			onChange={ ( newLayout ) => {
				switch ( newLayout ) {
					case 'list':
					case 'grid':
					case 'table':
						return onChangeView( {
							...view,
							type: newLayout,
							...defaultLayouts[ newLayout ],
						} );
				}
				throw new Error( 'Invalid dataview' );
			} }
		>
			{ availableLayouts.map( ( layout ) => {
				const config = VIEW_LAYOUTS.find( ( v ) => v.type === layout );
				if ( ! config ) {
					return null;
				}
				return (
					<ToggleGroupControlOption
						key={ layout }
						value={ layout }
						label={ config.label }
					/>
				);
			} ) }
		</ToggleGroupControl>
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
	const { view, onChangeView } = useContext( DataViewsContext );
	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			isBlock
			label={ __( 'Order' ) }
			value={ view.sort?.direction || 'desc' }
			disabled={ ! view?.sort?.field }
			onChange={ ( newDirection ) => {
				if ( ! view?.sort?.field ) {
					return;
				}
				if ( newDirection === 'asc' || newDirection === 'desc' ) {
					onChangeView( {
						...view,
						sort: {
							direction: newDirection,
							field: view.sort.field,
						},
					} );
					return;
				}
				throw new Error( 'Invalid direction' );
			} }
		>
			{ SORTING_DIRECTIONS.map( ( direction ) => {
				return (
					<ToggleGroupControlOption
						key={ direction }
						value={ direction }
						label={ sortLabelsShort[ direction ] }
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
								className={ clsx(
									'dataviews-view-config__field-control-button',
									{
										'is-hidden': ! isVisible,
									}
								) }
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
								icon={ seen }
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
	description: string;
	children: React.ReactNode;
} ) {
	return (
		<Grid columns={ 2 } className="dataviews-settings-section">
			<VStack>
				<h2 className="dataviews-settings-section__title">{ title }</h2>
				<span className="dataviews-settings-section__description">
					{ description }
				</span>
			</VStack>
			<VStack spacing={ 4 }>{ children }</VStack>
		</Grid>
	);
}

function DataviewsViewConfigContent( {
	defaultLayouts = { list: {}, grid: {}, table: {} },
}: ViewActionsProps ) {
	return (
		<VStack className="dataviews-view-config" spacing={ 6 }>
			<SettingsSection
				title={ __( 'Appearance' ) }
				description={ __( 'Customise the display of data' ) }
			>
				<LayoutPicker defaultLayouts={ defaultLayouts } />
				<HStack expanded className="is-divided-in-two">
					<SortFieldControl />
					<SortDirectionControl />
				</HStack>
				<ItemsPerPageControl />
			</SettingsSection>
			<SettingsSection
				title={ __( 'Properties' ) }
				description={ __( 'Manage property order and display' ) }
			>
				<FieldControl />
			</SettingsSection>
		</VStack>
	);
}

function _DataViewsViewConfig( {
	defaultLayouts = { list: {}, grid: {}, table: {} },
}: ViewActionsProps ) {
	const [ isShowingViewPopover, setIsShowingViewPopover ] =
		useState< boolean >( false );

	return (
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
						defaultLayouts={ defaultLayouts }
					/>
				</Popover>
			) }
		</div>
	);
}

const DataViewsViewConfig = memo( _DataViewsViewConfig );

export default DataViewsViewConfig;
