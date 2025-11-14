/**
 * External dependencies
 */
import type { Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import {
	useState,
	useMemo,
	useCallback,
	useEffect,
	createInterpolateElement,
} from '@wordpress/element';
import {
	Card,
	CardHeader,
	CardBody,
	__experimentalGrid as Grid,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataViews from '../components/dataviews/index';
import {
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_TIMELINE,
} from '../constants';
import filterSortAndPaginate from '../utils/filter-sort-and-paginate';
import type { Field, View } from '../types';
import {
	DEFAULT_VIEW,
	actions,
	data,
	fields,
	type SpaceObject,
	orderEventData,
	orderEventFields,
	orderEventActions,
	type OrderEvent,
} from './dataviews.fixtures';

import './dataviews.style.css';

const meta = {
	title: 'DataViews/DataViews',
	component: DataViews,
	// Use fullscreen layout and a wrapper div with padding to resolve conflicts
	// between Ariakit's Dialog (usePreventBodyScroll) and Storybook's body padding
	// (sb-main-padding class). This ensures consistent layout in DataViews stories
	// when clicking actions menus. Without this the padding on the body will jump.
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		( Story ) => (
			<div style={ { padding: '1rem' } }>
				<Story />
			</div>
		),
	],
} as Meta< typeof DataViews >;

export default meta;

const defaultLayouts = {
	[ LAYOUT_TABLE ]: {},
	[ LAYOUT_GRID ]: {},
	[ LAYOUT_LIST ]: {},
	[ LAYOUT_TIMELINE ]: {
		sort: {
			field: 'datetime',
			direction: 'asc' as const,
		},
	},
};

export const Default = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	hasClickableItems = true,
} ) => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'categories' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			actions={ actions }
			renderItemLink={ ( { item, ...props }: { item: SpaceObject } ) => (
				<button
					style={ { background: 'none', border: 'none', padding: 0 } }
					onClick={ () => {
						// eslint-disable-next-line no-alert
						alert( 'Clicked: ' + item.name.title );
					} }
					{ ...props }
				/>
			) }
			isItemClickable={ () => hasClickableItems }
			defaultLayouts={ defaultLayouts }
			config={ { perPageSizes } }
		/>
	);
};

Default.args = {
	perPageSizes: [ 10, 25, 50, 100 ],
	hasClickableItems: true,
};

Default.argTypes = {
	perPageSizes: {
		control: 'object',
		description: 'Array of available page sizes',
	},
	hasClickableItems: {
		control: 'boolean',
		description: 'Are the items clickable',
	},
};

export const Empty = () => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
	} );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ { totalItems: 0, totalPages: 0 } }
			data={ [] }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			actions={ actions }
			defaultLayouts={ defaultLayouts }
		/>
	);
};

export const CustomEmpty = () => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
	} );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ { totalItems: 0, totalPages: 0 } }
			data={ [] }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			actions={ actions }
			defaultLayouts={ defaultLayouts }
			empty={ <p>{ view.search ? 'No sites found' : 'No sites' }</p> }
		/>
	);
};

const MinimalUIComponent = ( {
	layout = 'table',
}: {
	layout: 'table' | 'list' | 'grid';
} ) => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
		layout: {
			enableMoving: false,
		},
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	const _fields: Field< SpaceObject >[] = fields.map( ( field ) => ( {
		...field,
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
	} ) );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			type: layout as any,
		} ) );
	}, [ layout ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ _fields }
			onChangeView={ setView }
			defaultLayouts={ { [ layout ]: {} } }
		>
			<DataViews.Layout />
			<DataViews.Footer />
		</DataViews>
	);
};
export const MinimalUI = {
	render: MinimalUIComponent,
	argTypes: {
		layout: {
			control: 'select',
			options: [ 'table', 'list', 'grid', 'timeline' ],
			defaultValue: 'table',
		},
	},
};

/**
 * Custom composition example
 */
function PlanetOverview( { planets }: { planets: SpaceObject[] } ) {
	const moons = planets.reduce( ( sum, item ) => sum + item.satellites, 0 );

	return (
		<>
			<Heading className="free-composition-heading" level={ 2 }>
				{ __( 'Solar System numbers' ) }
			</Heading>
			<Grid
				templateColumns="repeat(auto-fit, minmax(330px, 1fr))"
				align="flex-start"
				className="free-composition-header"
			>
				<Card variant="secondary">
					<CardBody>
						<VStack>
							<Text size={ 18 } as="p">
								{ createInterpolateElement(
									_n(
										'<PlanetsNumber /> planet',
										'<PlanetsNumber /> planets',
										planets.length
									),
									{
										PlanetsNumber: (
											<strong>{ planets.length } </strong>
										),
									}
								) }
							</Text>

							<Text size={ 18 } as="p">
								{ createInterpolateElement(
									_n(
										'<SatellitesNumber /> moon',
										'<SatellitesNumber /> moons',
										moons
									),
									{
										SatellitesNumber: (
											<strong>{ moons } </strong>
										),
									}
								) }
							</Text>
						</VStack>
					</CardBody>
				</Card>

				<VStack>
					<HStack justify="start">
						<DataViews.FiltersToggle />
						<DataViews.Search label={ __( 'moons by planet' ) } />
					</HStack>
					<DataViews.FiltersToggled />
				</VStack>

				<VStack>
					<HStack justify="end">
						<DataViews.Pagination />
						<DataViews.ViewConfig />
						<DataViews.LayoutSwitcher />
					</HStack>

					<DataViews.BulkActionToolbar />
				</VStack>
			</Grid>

			<DataViews.Layout className="free-composition-dataviews-layout" />
		</>
	);
}

/**
 * This is a basic example of using the DataViews component in
 * a free composition mode.
 *
 * Unlike the default usage where DataViews renders its own UI,
 * here we use it purely to provide context and handle data-related logic.
 *
 * The UI is fully custom and composed externally via the
 * `PlanetOverview` component.
 *
 * In future iterations, this story will showcase more advanced compositions
 * using built-in subcomponents like <Search />, filters,
 * or pagination controls.
 */
export const FreeComposition = () => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'categories' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
	} );

	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	const planets = processedData.filter( ( item ) =>
		item.categories.includes( 'Planet' )
	);

	return (
		<div className="free-composition">
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ processedData }
				view={ view }
				fields={ fields }
				actions={ actions }
				onChangeView={ setView }
				defaultLayouts={ {
					table: {},
					grid: {},
				} }
				empty={
					<VStack
						justify="space-around"
						alignment="center"
						className="free-composition-dataviews-empty"
					>
						<Text size={ 18 } as="p">
							No planets
						</Text>
						<Text variant="muted">{ `Try a different search because “${ view.search }” returned no results.` }</Text>
						<Button variant="secondary">Create new planet</Button>
					</VStack>
				}
			>
				<PlanetOverview planets={ planets } />
			</DataViews>
		</div>
	);
};

export const WithCard = () => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'categories' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<Card>
			<CardHeader>Header</CardHeader>
			<CardBody>
				<DataViews
					getItemId={ ( item ) => item.id.toString() }
					paginationInfo={ paginationInfo }
					data={ shownData }
					view={ view }
					fields={ fields }
					onChangeView={ setView }
					actions={ actions.filter(
						( action ) => ! action.supportsBulk
					) }
					defaultLayouts={ defaultLayouts }
				/>
			</CardBody>
		</Card>
	);
};

export const GroupByLayout = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_GRID,
		search: '',
		page: 1,
		perPage: 20,
		filters: [],
		fields: [ 'satellites' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		groupBy: { field: 'type', direction: 'asc' },
		layout: {
			badgeFields: [ 'satellites' ],
		},
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			actions={ actions }
			defaultLayouts={ defaultLayouts }
		/>
	);
};

export const InfiniteScroll = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_GRID,
		search: '',
		page: 1,
		perPage: 6, // Start with a small number to demonstrate pagination
		filters: [],
		fields: [ 'satellites' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'image',
		infiniteScrollEnabled: true, // Enable infinite scroll by default
	} );
	const { data: shownData } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	// Custom pagination handler that simulates server-side pagination
	const [ allLoadedRecords, setAllLoadedRecords ] = useState< SpaceObject[] >(
		[]
	);
	const [ isLoadingMore, setIsLoadingMore ] = useState( false );

	const totalItems = data.length;
	const totalPages = Math.ceil( totalItems / 6 ); // perPage is 6.
	const currentPage = view.page || 1;
	const hasMoreData = currentPage < totalPages;
	const getItemId = ( item: {
		id: any;
		title?: string;
		description?: string;
		image?: string;
		type?: string;
		isPlanet?: boolean;
		categories?: string[];
		satellites?: number;
		date?: string;
		datetime?: string;
		email?: string;
	} ) => item.id.toString();

	const infiniteScrollHandler = useCallback( () => {
		if ( isLoadingMore || currentPage >= totalPages ) {
			return;
		}

		setIsLoadingMore( true );

		setView( {
			...view,
			page: currentPage + 1,
		} );
	}, [ isLoadingMore, currentPage, totalPages, view ] );

	// Initialize data on first load or when view changes significantly
	useEffect( () => {
		if ( currentPage === 1 || ! view.infiniteScrollEnabled ) {
			// First page - replace all data
			setAllLoadedRecords( shownData );
		} else {
			// Subsequent pages - append to existing data
			setAllLoadedRecords( ( prev ) => {
				const existingIds = new Set( prev.map( getItemId ) );
				const newRecords = shownData.filter(
					( record ) => ! existingIds.has( getItemId( record ) )
				);
				return [ ...prev, ...newRecords ];
			} );
		}
		setIsLoadingMore( false );
	}, [
		shownData,
		view.search,
		view.filters,
		view.perPage,
		currentPage,
		view.infiniteScrollEnabled,
	] );

	const paginationInfo = {
		totalItems,
		totalPages,
		infiniteScrollHandler,
	};

	return (
		<>
			<style>{ `
			.dataviews-wrapper {
				height: 600px;
				overflow: auto;
			}
		` }</style>
			<Text
				style={ {
					marginBottom: '16px',
					padding: '8px',
					background: '#f0f0f0',
					borderRadius: '4px',
					display: 'block',
				} }
			>
				{ __( 'Infinite Scroll Demo' ) }: { allLoadedRecords.length } of{ ' ' }
				{ totalItems } items loaded.
				{ isLoadingMore && __( 'Loading more…' ) }
				{ ! hasMoreData && __( 'All items loaded!' ) }
			</Text>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ allLoadedRecords }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				actions={ actions }
				isLoading={ isLoadingMore }
				defaultLayouts={ defaultLayouts }
			/>
		</>
	);
};

const TimelineComponent = ( {
	showMedia = true,
	grouping = true,
	density = 'balanced',
}: {
	showMedia: boolean;
	grouping: boolean;
	density: 'compact' | 'balanced' | 'comfortable';
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TIMELINE,
		search: '',
		page: 1,
		perPage: 20,
		filters: [],
		fields: [ 'datetime', 'categories', 'orderNumber' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'icon',
		showMedia,
		sort: {
			field: 'datetime',
			direction: 'asc',
		},
		groupBy: grouping
			? {
					field: 'date',
					direction: 'asc',
			  }
			: undefined,
		layout: {
			density,
		},
	} );
	useEffect( () => {
		setView( ( prevView ) => {
			const prevLayout =
				prevView.type === LAYOUT_TIMELINE ? prevView.layout : {};
			return {
				...prevView,
				type: LAYOUT_TIMELINE,
				groupBy: grouping
					? { field: 'date', direction: 'asc' }
					: undefined,
				showMedia,
				layout: {
					...prevLayout,
					density,
				},
			};
		} );
	}, [ showMedia, grouping, density ] );

	// Custom fields with render methods for date and datetime
	const timelineFields: Field< OrderEvent >[] = orderEventFields.map(
		( field ) => {
			if ( field.id === 'date' ) {
				return {
					...field,
					render: ( { item } ) => {
						return (
							<span>
								{ new Date( item.date ).toLocaleDateString(
									'en-US',
									{
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									}
								) }
							</span>
						);
					},
				};
			}
			if ( field.id === 'datetime' ) {
				return {
					...field,
					render: ( { item } ) => {
						const dateObj = new Date( item.datetime );
						// When grouping is off, show date and time
						if ( ! grouping ) {
							return (
								<span>
									{ dateObj.toLocaleDateString( 'en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									} ) }{ ' ' }
									{ dateObj.toLocaleTimeString( 'en-US', {
										hour: 'numeric',
										minute: '2-digit',
										hour12: true,
									} ) }
								</span>
							);
						}
						// When grouping is on, show only time
						return (
							<span>
								{ dateObj.toLocaleTimeString( 'en-US', {
									hour: 'numeric',
									minute: '2-digit',
									hour12: true,
								} ) }
							</span>
						);
					},
				};
			}
			return field;
		}
	);

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( orderEventData, view, timelineFields );
	}, [ view, timelineFields ] );
	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ timelineFields }
			onChangeView={ setView }
			actions={ orderEventActions }
			defaultLayouts={ {
				[ LAYOUT_TIMELINE ]: {
					sort: {
						field: 'datetime',
						direction: 'asc',
					},
				},
			} }
		/>
	);
};

export const Timeline = {
	render: TimelineComponent,
	args: {
		showMedia: true,
		grouping: true,
		density: 'balanced',
	},
	argTypes: {
		showMedia: {
			control: 'boolean',
			options: [ true, false ],
			defaultValue: true,
			description: 'Whether the icon is shown in the timeline',
		},
		grouping: {
			control: 'boolean',
			options: [ true, false ],
			defaultValue: true,
			description: 'Whether items are grouped by date in the timeline',
		},
		density: {
			control: 'select',
			options: [ 'compact', 'balanced', 'comfortable' ],
			defaultValue: 'balanced',
			description: 'Density of the timeline',
		},
	},
};
