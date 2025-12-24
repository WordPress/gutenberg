/**
 * WordPress dependencies
 */
import {
	useState,
	useMemo,
	createInterpolateElement,
} from '@wordpress/element';
import {
	Card,
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
import DataViews from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data, fields, type SpaceObject } from './fixtures';
import { LAYOUT_TABLE } from '../../constants';

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
export const FreeCompositionComponent = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {
			styles: {
				satellites: {
					align: 'end' as const,
				},
			},
			enableMoving: false,
		},
		filters: [],
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

export default FreeCompositionComponent;
