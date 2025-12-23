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
	__experimentalHeading as Heading,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViews from '../dataviews/index';
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
	<Stack direction="column" align="center" justify="center" gap="sm">
		<PlanetIllustration />
		<Text>No celestial bodies found</Text>
	</Stack>
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
			<div className="free-composition-header">
				<Stack direction="column" gap="md">
					<Stack direction="row" justify="start" gap="xs">
						<DataViews.Search label={ __( 'Search content' ) } />
						<DataViews.FiltersToggle />
						<Stack
							direction="row"
							justify="end"
							gap="xs"
							style={ { flex: 1 } }
						>
							<DataViews.ViewConfig />
							<DataViews.LayoutSwitcher />
						</Stack>
					</Stack>
					<DataViews.FiltersToggled />
					<Card variant="secondary">
						<CardBody>
							<Stack direction="column" gap="xs">
								<Text size={ 18 } as="p">
									{ createInterpolateElement(
										_n(
											'<PlanetsNumber /> planet',
											'<PlanetsNumber /> planets',
											planets.length
										),
										{
											PlanetsNumber: (
												<strong>
													{ planets.length }{ ' ' }
												</strong>
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
							</Stack>
						</CardBody>
					</Card>
					<Card style={ { width: '100%' } }>
						<CardBody>
							<Stack
								direction="row"
								justify="space-between"
								align="center"
								gap="xs"
							>
								<DataViews.BulkActionToolbar />
								<DataViews.Pagination />
							</Stack>
						</CardBody>
					</Card>
					<DataViews.Layout className="free-composition-dataviews-layout" />
				</Stack>
			</div>
		</>
	);
}

/**
 * Demonstrates how to build a custom layout using DataViews sub-components.
 *
 * Instead of using the default DataViews UI, this story shows how to:
 * - Use `<DataViews>` as a context provider (wrapping custom children)
 * - Compose your own layout with built-in sub-components:
 *   - `<DataViews.Search />` - Search input
 *   - `<DataViews.FiltersToggle />` - Button to show/hide filters
 *   - `<DataViews.FiltersToggled />` - The filter UI itself
 *   - `<DataViews.Pagination />` - Page navigation
 *   - `<DataViews.ViewConfig />` - View settings (columns, density, etc.)
 *   - `<DataViews.LayoutSwitcher />` - Switch between table/grid/list views
 *   - `<DataViews.BulkActionToolbar />` - Actions for selected items
 *   - `<DataViews.Layout />` - The data display (table, grid, etc.)
 *
 * This pattern is useful when you need full control over the UI layout
 * while still leveraging DataViews' data management and state handling.
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
					<Stack
						direction="column"
						gap="xs"
						justify="space-around"
						align="center"
						className="free-composition-dataviews-empty"
					>
						<Text size={ 18 } as="p">
							No planets
						</Text>
						<Text variant="muted">{ `Try a different search because “${ view.search }” returned no results.` }</Text>
						<Button variant="secondary">Create new planet</Button>
					</Stack>
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

const GroupByLayoutComponent = ( {
	showLabel = true,
}: {
	showLabel: boolean;
} ) => {
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
		groupBy: { field: 'type', direction: 'asc', showLabel },
		layout: {
			badgeFields: [ 'satellites' ],
		},
	} );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			groupBy: { field: 'type', direction: 'asc', showLabel },
		} ) );
	}, [ showLabel ] );

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

export const GroupByLayout = {
	render: GroupByLayoutComponent,
	args: {
		showLabel: true,
	},
	argTypes: {
		showLabel: {
			control: 'boolean',
			description:
				'Whether to show the field label in group headers (e.g., "Type: Planet" vs just "Planet")',
		},
	},
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

const ActivityComponent = ( {
	showMedia = true,
	grouping = true,
	showLabel = true,
}: {
	showMedia: boolean;
	grouping: boolean;
	showLabel: boolean;
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
					showLabel,
			  }
			: undefined,
	} );
	useEffect( () => {
		setView( ( prevView ) => {
			return {
				...prevView,
				groupBy: grouping
					? { field: 'date', direction: 'asc', showLabel }
					: undefined,
				showMedia,
			};
		} );
	}, [ showMedia, grouping, showLabel ] );

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
		showLabel: true,
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
		showLabel: {
			control: 'boolean',
			description:
				'Whether to show the field label in group headers (e.g., "Date: Dec 15" vs just "Dec 15")',
		},
	},
};
