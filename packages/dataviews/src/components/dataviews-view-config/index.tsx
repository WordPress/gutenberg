import {
	Button,
	Popover as WCPopover,
	SlotFillProvider,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __, _x, isRTL } from '@wordpress/i18n';
import { memo, useContext, useMemo, useState } from '@wordpress/element';
import { cog } from '@wordpress/icons';
import warning from '@wordpress/warning';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Prototype adoption of Drawer; verify mixed overlays before shipping.
	Drawer,
	SelectControl,
	Stack,
	Tabs,
} from '@wordpress/ui';
import { SORTING_DIRECTIONS, sortIcons, sortLabels } from '../../constants';
import { VIEW_LAYOUTS } from '../dataviews-layouts';
import type { View } from '../../types';
import DataViewsContext from '../dataviews-context';
import { PropertiesSection } from './properties-section';
import { Filters } from '../dataviews-filters';

function changeViewType(
	type: View[ 'type' ],
	{
		view,
		onChangeView,
		defaultLayouts,
	}: React.ContextType< typeof DataViewsContext >
) {
	const viewWithoutLayout = { ...view };
	if ( 'layout' in viewWithoutLayout ) {
		delete viewWithoutLayout.layout;
	}
	onChangeView( {
		...viewWithoutLayout,
		type,
		...defaultLayouts[ type ],
	} as View );
}

function LayoutControl() {
	const context = useContext( DataViewsContext );
	const layouts = (
		Object.keys( context.defaultLayouts ) as View[ 'type' ][]
	 ).flatMap( ( type ) => {
		const layout = VIEW_LAYOUTS.find( ( item ) => item.type === type );
		return layout ? [ { value: type, label: layout.label } ] : [];
	} );
	if ( layouts.length <= 1 ) {
		return null;
	}
	return (
		<SelectControl
			label={ __( 'Layout' ) }
			value={ layouts.find(
				( layout ) => layout.value === context.view.type
			) }
			items={ layouts }
			onValueChange={ ( item ) => {
				const layout = layouts.find(
					( option ) => option.value === item?.value
				);
				if ( layout && layout.value !== context.view.type ) {
					changeViewType( layout.value, context );
				}
			} }
		/>
	);
}

function ViewFilters() {
	const context = useContext( DataViewsContext );
	const [ openedFilter, setOpenedFilter ] = useState< string | null >( null );
	return (
		<DataViewsContext.Provider
			value={ {
				...context,
				openedFilter,
				setOpenedFilter,
				constrainFilterEditor: true,
				onChangeView: ( view ) => {
					context.onChangeView( view );
					context.setIsShowingFilter( true );
				},
			} }
		>
			<Filters showEmpty />
		</DataViewsContext.Provider>
	);
}

export function ViewTypeMenu() {
	const context = useContext( DataViewsContext );
	const { view, defaultLayouts } = context;
	const availableLayouts = Object.keys( defaultLayouts );
	if ( availableLayouts.length <= 1 ) {
		return null;
	}
	const activeView = VIEW_LAYOUTS.find( ( v ) => view.type === v.type );
	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						size="compact"
						icon={ activeView?.icon }
						label={ __( 'Layout' ) }
					/>
				}
			/>
			<Menu.Popup>
				<Menu.RadioGroup
					value={ view.type }
					onValueChange={ ( value: string ) => {
						switch ( value ) {
							case 'list':
							case 'grid':
							case 'table':
							case 'pickerGrid':
							case 'pickerTable':
							case 'pickerActivity':
							case 'activity':
								return changeViewType( value, context );
						}
						warning( 'Invalid dataview' );
					} }
				>
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
								closeOnClick
							>
								<Menu.ItemLabel>
									{ config.label }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						);
					} ) }
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.Root>
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
	const selectedSortItem =
		orderOptions.find( ( item ) => item.value === view.sort?.field ) ??
		orderOptions[ 0 ];

	if ( ! selectedSortItem ) {
		return null;
	}

	return (
		<SelectControl
			label={ __( 'Sort by' ) }
			value={ selectedSortItem }
			items={ orderOptions }
			onValueChange={ ( item ) => {
				if (
					! item ||
					item.value === null ||
					item.value === selectedSortItem.value
				) {
					return;
				}
				onChangeView( {
					...view,
					sort: {
						direction: view?.sort?.direction || 'desc',
						field: item.value,
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
	const { view, onReset, setOpenedFilter } = useContext( DataViewsContext );
	const activeLayout = VIEW_LAYOUTS.find(
		( layout ) => layout.type === view.type
	);
	const isModified = typeof onReset === 'function';
	return (
		<Drawer.Root
			swipeDirection={ isRTL() ? 'left' : 'right' }
			onOpenChange={ ( isOpen ) => {
				if ( isOpen ) {
					setOpenedFilter( null );
				}
			} }
		>
			<div className="dataviews-view-config__toggle-wrapper">
				<Drawer.Trigger
					render={
						<Button
							size="compact"
							icon={ cog }
							label={ _x(
								'View options',
								'View is used as a noun'
							) }
						/>
					}
				/>
				{ isModified && (
					<span className="dataviews-view-config__modified-indicator" />
				) }
			</div>
			<SlotFillProvider>
				<Drawer.Popup size="large" className="dataviews-view-config">
					<Drawer.Header>
						<Drawer.Title>{ __( 'View settings' ) }</Drawer.Title>
						<Stack direction="row" gap="sm" align="center">
							<ResetViewButton />
							<Drawer.CloseIconButton />
						</Stack>
					</Drawer.Header>
					<Drawer.Content className="dataviews-view-config__content">
						<Tabs.Root defaultValue="appearance">
							<Tabs.List variant="minimal">
								<Tabs.Tab value="appearance">
									{ __( 'Appearance' ) }
								</Tabs.Tab>
								<Tabs.Tab value="properties">
									{ __( 'Property visibility' ) }
								</Tabs.Tab>
								<Tabs.Tab value="filters">
									{ __( 'Filters' ) }
								</Tabs.Tab>
							</Tabs.List>
							<Tabs.Panel
								value="appearance"
								className="dataviews-view-config__panel"
							>
								<Stack direction="column" gap="lg">
									<LayoutControl />
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
									<ItemsPerPageControl />
								</Stack>
							</Tabs.Panel>
							<Tabs.Panel
								value="properties"
								className="dataviews-view-config__panel"
							>
								<PropertiesSection
									showLabel={ false }
									showEmpty
								/>
							</Tabs.Panel>
							<Tabs.Panel
								value="filters"
								className="dataviews-view-config__panel"
							>
								<ViewFilters />
							</Tabs.Panel>
						</Tabs.Root>
						{ /* Keep legacy popovers inside the drawer's content boundary. */ }
						<WCPopover.Slot />
					</Drawer.Content>
				</Drawer.Popup>
			</SlotFillProvider>
		</Drawer.Root>
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
