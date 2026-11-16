import { useState, useMemo } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { Action, View } from '../../types';
import {
	actions as fixtureActions,
	data,
	fields,
	type SpaceObject,
} from './fixtures';

const noop = () => {};

const actions: Action< SpaceObject >[] = [
	{ id: 'share', label: 'Share', isPrimary: true, callback: noop },
	{ id: 'download', label: 'Download', isPrimary: true, callback: noop },
	{ id: 'rename', label: 'Rename', isPrimary: true, callback: noop },
	// Includes a non-primary action (Delete) and the fixtures' View action.
	...fixtureActions,
];

/**
 * Primary actions are shown inline (on hover or focus) only when the table
 * fits its container at its natural width with them. Otherwise they collapse
 * into the actions menu and the actions column is as narrow as the menu
 * button. Drag the bottom-right corner of the box to resize it.
 */
export const LayoutTableDynamicActionsComponent = ( {
	containerWidth = '100%',
	visibleFields = [ 'author', 'date' ],
}: {
	containerWidth?: string;
	visibleFields?: string[];
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {},
		filters: [],
		fields: visibleFields,
		titleField: 'title',
		mediaField: 'image',
		showMedia: true,
	} );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	return (
		<div
			style={ {
				width: containerWidth,
				maxWidth: '100%',
				minWidth: 320,
				resize: 'horizontal',
				overflow: 'hidden',
				border: '1px dashed #949494',
			} }
		>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				actions={ actions }
				defaultLayouts={ { [ LAYOUT_TABLE ]: true } }
			/>
		</div>
	);
};

export default LayoutTableDynamicActionsComponent;
