import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import DataViewsPicker from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import { LAYOUT_PICKER_ACTIVITY } from '../../constants';
import type { ActionButton, View } from '../../types';
import { data, fields, type SpaceObject } from './fixtures';

/**
 * Demonstrates composing `DataViewsPicker` for a container too narrow for its
 * default UI, the way a sidebar panel is. Narrow the canvas with Storybook's
 * viewport control to see what the composition buys.
 *
 * The footer is the part worth composing: its full row holds the selection
 * count, the pagination and the actions, which is more than a sidebar can
 * carry. `DataViewsPicker.Footer` and `DataViewsPicker.Pagination` render
 * children in place of their default contents, so this one keeps one
 * pagination part and the action and drops the rest:
 *
 * ```jsx
 * <DataViewsPicker.Footer>
 * 	<DataViewsPicker.Pagination>
 * 		<DataViewsPicker.PageSelect />
 * 	</DataViewsPicker.Pagination>
 * 	<DataViewsPicker.Actions />
 * </DataViewsPicker.Footer>
 * ```
 *
 * Which part earns the room is the consumer's call, so the `pagination` control
 * swaps the page select for `DataViewsPicker.PageNavigation`, the previous/next
 * buttons, which suit a list short enough to walk through a page at a time.
 *
 * The row spreads its parts, so a footer left holding one of them — on a single
 * page of results, where the pagination renders nothing — keeps it at the
 * start. Each part takes a `className`, so placing it anywhere else is done
 * from the consumer's own stylesheet rather than by the picker.
 */
export const FreeCompositionComponent = ( {
	pagination = 'page-select',
}: {
	/**
	 * Which pagination part the composed footer keeps.
	 */
	pagination?: 'page-select' | 'page-navigation';
} ) => {
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
					{ pagination === 'page-select' ? (
						<DataViewsPicker.PageSelect />
					) : (
						<DataViewsPicker.PageNavigation />
					) }
				</DataViewsPicker.Pagination>
				<DataViewsPicker.Actions />
			</DataViewsPicker.Footer>
		</DataViewsPicker>
	);
};

export default FreeCompositionComponent;
