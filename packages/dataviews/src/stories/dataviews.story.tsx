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
	useRef,
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
	LAYOUT_ACTIVITY,
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
	[ LAYOUT_ACTIVITY ]: {},
};

export const Default = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	hasClickableItems = true,
	backgroundColor,
}: {
	perPageSizes?: number[];
	hasClickableItems?: boolean;
	backgroundColor?: string;
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
		<div
			style={
				{
					'--wp-dataviews-color-background': backgroundColor,
				} as React.CSSProperties
			}
		>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				actions={ actions }
				renderItemLink={ ( {
					item,
					...props
				}: {
					item: SpaceObject;
				} ) => (
					<button
						style={ {
							background: 'none',
							border: 'none',
							padding: 0,
						} }
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
		</div>
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
	backgroundColor: {
		control: 'color',
		description: 'Background color of the DataViews component',
	},
};

const PlanetIllustration = () => (
	<svg
		width="120"
		height="120"
		viewBox="0 0 120 120"
		fill="none"
		style={ { opacity: 0.6 } }
	>
		<circle cx="60" cy="60" r="35" fill="#9ca3af" />
		<ellipse
			cx="60"
			cy="60"
			rx="55"
			ry="12"
			stroke="#9ca3af"
			strokeWidth="3"
			fill="none"
		/>
	</svg>
);

const CustomEmptyComponent = () => (
	<VStack alignment="center" justify="center" spacing={ 3 }>
		<PlanetIllustration />
		<Text>No celestial bodies found</Text>
	</VStack>
);

const EmptyComponent = ( {
	customEmpty,
	containerHeight,
	isLoading,
}: {
	customEmpty?: boolean;
	containerHeight?: 'auto' | '50vh' | '100vh';
	isLoading?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'description', 'categories' ],
	} );

	return (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				height: containerHeight,
			} }
		>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ { totalItems: 0, totalPages: 0 } }
				data={ [] }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				actions={ actions }
				defaultLayouts={ defaultLayouts }
				isLoading={ isLoading }
				empty={ customEmpty ? <CustomEmptyComponent /> : undefined }
			/>
		</div>
	);
};

export const Empty = {
	render: EmptyComponent,
	args: {
		customEmpty: false,
		containerHeight: '50vh',
		isLoading: false,
	},
	argTypes: {
		customEmpty: {
			control: 'boolean',
			description: 'Use custom empty state with planet illustration',
		},
		containerHeight: {
			control: 'select',
			options: [ 'auto', '50vh', '100vh' ],
			description: 'Height of the container',
		},
		isLoading: {
			control: 'boolean',
			description: 'Show loading state',
		},
	},
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
			options: [ 'table', 'list', 'grid', 'activity' ],
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
	const [ allLoadedRecords, setAllLoadedRecords ] = useState<
		( SpaceObject | null )[]
	>( [] );
	const [ isLoadingMore, setIsLoadingMore ] = useState( false );
	const [ scrollDirection, setScrollDirection ] = useState<
		'up' | 'down' | undefined
	>( undefined );

	const [ visibleEntries, setVisibleEntries ] = useState< number[] >( [] );

	// Track the mapping of item IDs to their positions in the full dataset
	const positionMapRef = useRef< Map< string, number > >( new Map() );

	// Track the range of data we've loaded to maintain placeholders
	const loadedRangeRef = useRef< { min: number; max: number } | null >(
		null
	);

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

	const infiniteScrollHandler = useCallback(
		( direction: 'up' | 'down' ) => {
			if ( isLoadingMore ) {
				return;
			}

			// Handle scrolling down to load next page
			if ( direction === 'down' && currentPage < totalPages ) {
				setIsLoadingMore( true );
				setScrollDirection( 'down' );
				setView( {
					...view,
					page: currentPage + 1,
				} );
			}

			// Handle scrolling up to load previous page
			if ( direction === 'up' && currentPage > 1 ) {
				setIsLoadingMore( true );
				setScrollDirection( 'up' );
				setView( {
					...view,
					page: currentPage - 1,
				} );
			}
		},
		[ isLoadingMore, currentPage, totalPages, view ]
	);

	// Initialize data on first load or when view changes significantly
	useEffect( () => {
		if (
			( currentPage === 1 && ! allLoadedRecords.length ) ||
			! view.infiniteScrollEnabled
		) {
			// First page - replace all data and initialize range
			const startPosition = 1;
			const records = shownData.map( ( record, index ) => {
				const position = view.infiniteScrollEnabled
					? startPosition + index
					: undefined;
				if ( position !== undefined ) {
					positionMapRef.current.set( getItemId( record ), position );
				}
				return {
					...record,
					position,
				};
			} );
			setAllLoadedRecords( records );

			if ( records.length > 0 ) {
				loadedRangeRef.current = {
					min: Math.min( ...records.map( ( r ) => r.id ) ),
					max: Math.max( ...records.map( ( r ) => r.id ) ),
				};
			}
		} else {
			// Subsequent pages - load more data with placeholders
			setAllLoadedRecords( ( prev ) => {
				const existingIds = new Set(
					prev
						.filter(
							( item ): item is SpaceObject => item !== null
						)
						.map( getItemId )
				);
				// Calculate start position based on the highest position already tracked
				let nextPosition =
					positionMapRef.current.size > 0
						? Math.max( ...positionMapRef.current.values() ) + 1
						: 1;

				const newRecords = shownData
					.filter(
						( record ) => ! existingIds.has( getItemId( record ) )
					)
					.map( ( record ) => {
						const itemId = getItemId( record );
						let position: number | undefined;

						if ( view.infiniteScrollEnabled ) {
							// Check if this record already has a position
							const existingPosition =
								positionMapRef.current.get( itemId );
							if ( existingPosition !== undefined ) {
								position = existingPosition;
							} else {
								// Assign new position and increment for next record
								position = nextPosition;
								positionMapRef.current.set( itemId, position );
								nextPosition++;
							}
						}

						return {
							...record,
							position,
						};
					} );

				if ( newRecords.length === 0 ) {
					return prev;
				}

				// Update the loaded range
				const allRecords =
					scrollDirection === 'up'
						? [ ...newRecords, ...prev ]
						: [ ...prev, ...newRecords ];

				const allIds = allRecords
					.filter( ( r ): r is SpaceObject => r !== null )
					.map( ( r ) => r.id );
				const newMin = Math.min( ...allIds );
				const newMax = Math.max( ...allIds );

				loadedRangeRef.current = {
					min: newMin,
					max: newMax,
				};

				// Create array with placeholders to maintain positions
				const result: ( SpaceObject | null )[] = [];
				for ( let id = newMin; id <= newMax; id++ ) {
					const record = allRecords.find(
						( r ) => r !== null && r.id === id
					);
					result.push( record || null );
				}

				// Filter to keep only records that should remain visible
				// Keep items within a certain range of visible entries
				if ( visibleEntries.length > 0 ) {
					const visibleMin = Math.min( ...visibleEntries );
					const visibleMax = Math.max( ...visibleEntries );
					const buffer = 6;

					const filtered = result
						.map( ( record, index ) => {
							const itemId = newMin + index;
							// Keep records that are null (placeholders) or within the visible range
							if ( record === null ) {
								return record;
							}
							// Keep items within buffer range of visible items
							if (
								itemId >= visibleMin - buffer &&
								itemId <= visibleMax + buffer
							) {
								return record;
							}
							// Replace with placeholder if outside buffer
							return null;
						} )
						.filter(
							( record, index ) =>
								record !== null ||
								( newMin + index >= visibleMin - buffer &&
									newMin + index <= visibleMax + buffer )
						);

					return filtered;
				}

				return result.filter( ( r ) => r !== null );
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
		allLoadedRecords.length,
		scrollDirection,
		visibleEntries,
	] );

	const paginationInfo = {
		totalItems,
		totalPages,
		infiniteScrollHandler,
		setVisibleEntries,
	};

	// Filter out null placeholders for display
	const displayData = allLoadedRecords.filter(
		( record ): record is SpaceObject => record !== null
	);

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
				{ __( 'Infinite Scroll Demo' ) }: { displayData.length } of{ ' ' }
				{ totalItems } items loaded.
				{ isLoadingMore && __( 'Loading more…' ) }
				{ ! hasMoreData && __( 'All items loaded!' ) }
			</Text>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ displayData }
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

const ActivityComponent = ( {
	showMedia = true,
	grouping = true,
}: {
	showMedia: boolean;
	grouping: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_ACTIVITY,
		search: '',
		page: 1,
		perPage: 20,
		filters: [],
		fields: [ 'time', 'categories', 'orderNumber' ],
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
	} );
	useEffect( () => {
		setView( ( prevView ) => {
			return {
				...prevView,
				groupBy: grouping
					? { field: 'date', direction: 'asc' }
					: undefined,
				showMedia,
			};
		} );
	}, [ showMedia, grouping ] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( orderEventData, view, orderEventFields );
	}, [ view ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ orderEventFields }
			onChangeView={ setView }
			actions={ orderEventActions }
			defaultLayouts={ {
				[ LAYOUT_ACTIVITY ]: {
					sort: {
						field: 'datetime',
						direction: 'asc',
					},
				},
			} }
		/>
	);
};

export const Activity = {
	render: ActivityComponent,
	args: {
		showMedia: true,
		grouping: true,
	},
	argTypes: {
		showMedia: {
			control: 'boolean',
			options: [ true, false ],
			defaultValue: true,
			description: 'Whether the icon is shown in the activity list',
		},
		grouping: {
			control: 'boolean',
			options: [ true, false ],
			defaultValue: true,
			description:
				'Whether items are grouped by date in the activity list',
		},
	},
};
