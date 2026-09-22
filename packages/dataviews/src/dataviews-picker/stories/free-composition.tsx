import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import DataViewsPicker from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import { LAYOUT_PICKER_ACTIVITY } from '../../constants';
import type { ActionButton, View } from '../../types';
import { data, fields, type SpaceObject } from './fixtures';

const STYLES = `
	.dataviews-picker-free-composition {
		width: 300px;
		max-width: 100%;
		border: 1px solid var(--wpds-color-stroke-surface-neutral-weak);
	}

	/*
	 * The footer spreads its parts, so on a single page of results — where the
	 * page select renders nothing — the action would fall to the start of the
	 * row. Keep it at the end whichever parts survive.
	 */
	.dataviews-picker-free-composition__actions {
		margin-inline-start: auto;
	}
`;

/**
 * Demonstrates composing `DataViewsPicker` for a container too narrow for its
 * default UI, the way a sidebar panel is.
 *
 * The footer is the part worth composing: its full row holds the selection
 * count, the pagination and the actions, which is more than 300px can carry.
 * `DataViewsPicker.Footer` and `DataViewsPicker.Pagination` render children in
 * place of their default contents, so this one keeps the page select and the
 * action and drops the rest:
 *
 * ```jsx
 * <DataViewsPicker.Footer>
 * 	<DataViewsPicker.Pagination>
 * 		<DataViewsPicker.PageSelect />
 * 	</DataViewsPicker.Pagination>
 * 	<DataViewsPicker.Actions className="…" />
 * </DataViewsPicker.Footer>
 * ```
 *
 * Each part takes a `className`, so where they sit is decided by the stylesheet
 * of whoever composed them rather than by the picker.
 */
export const FreeCompositionComponent = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_PICKER_ACTIVITY,
		fields: [],
		titleField: 'title',
		mediaField: 'image',
		descriptionField: 'description',
		search: '',
		filters: [],
		page: 1,
		perPage: 6,
	} );
	const [ selection, setSelection ] = useState< string[] >( [] );

	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( data, view, fields ),
		[ view ]
	);

	const actions: ActionButton< SpaceObject >[] = [
		{
			id: 'apply',
			label: __( 'Apply' ),
			isPrimary: true,
			supportsBulk: false,
			callback( items ) {
				// eslint-disable-next-line no-alert
				window.alert(
					items.map( ( item ) => item.name.title ).join( ', ' )
				);
			},
		},
	];

	return (
		<>
			<style>{ STYLES }</style>
			<div className="dataviews-picker-free-composition">
				<DataViewsPicker
					view={ view }
					onChangeView={ setView }
					fields={ fields }
					data={ shownData }
					paginationInfo={ paginationInfo }
					getItemId={ ( item ) => item.id.toString() }
					selection={ selection }
					onChangeSelection={ setSelection }
					actions={ actions }
					defaultLayouts={ { pickerActivity: true } }
					itemListLabel={ __( 'Galactic Bodies' ) }
				>
					<Stack direction="row" gap="sm" justify="start">
						<DataViewsPicker.Search
							label={ __( 'Search galactic bodies' ) }
						/>
						<DataViewsPicker.FiltersToggle />
					</Stack>
					<DataViewsPicker.FiltersToggled />
					<DataViewsPicker.Layout />
					<DataViewsPicker.Footer>
						<DataViewsPicker.Pagination>
							<DataViewsPicker.PageSelect />
						</DataViewsPicker.Pagination>
						<DataViewsPicker.Actions className="dataviews-picker-free-composition__actions" />
					</DataViewsPicker.Footer>
				</DataViewsPicker>
			</div>
		</>
	);
};

export default FreeCompositionComponent;
