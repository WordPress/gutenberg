/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DataViews, LAYOUT_GRID, LAYOUT_TABLE } from '../index';

import { DEFAULT_VIEW, actions, data } from './fixtures';

const meta = {
	title: 'DataViews (Experimental)/DataViews',
	component: DataViews,
};
export default meta;

const defaultConfigPerViewType = {
	[ LAYOUT_TABLE ]: {},
	[ LAYOUT_GRID ]: {
		mediaField: 'image',
		primaryField: 'title',
	},
};

function normalizeSearchInput( input = '' ) {
	return input.trim().toLowerCase();
}

const fields = [
	{
		header: 'Image',
		id: 'image',
		render: ( { item } ) => {
			return (
				<img src={ item.image } alt="" style={ { width: '100%' } } />
			);
		},
		width: 50,
		enableSorting: false,
	},
	{
		header: 'Title',
		id: 'title',
		getValue: ( { item } ) => item.title,
		maxWidth: 400,
		enableHiding: false,
	},
	{
		header: 'Description',
		id: 'description',
		getValue: ( { item } ) => item.description,
		maxWidth: 200,
		enableSorting: false,
	},
];

export const Default = ( props ) => {
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const { shownData, paginationInfo } = useMemo( () => {
		let filteredData = [ ...data ];
		// Handle global search.
		if ( view.search ) {
			const normalizedSearch = normalizeSearchInput( view.search );
			filteredData = filteredData.filter( ( item ) => {
				return [
					normalizeSearchInput( item.title ),
					normalizeSearchInput( item.description ),
				].some( ( field ) => field.includes( normalizedSearch ) );
			} );
		}
		// Handle sorting.
		if ( view.sort ) {
			const stringSortingFields = [ 'title' ];
			const fieldId = view.sort.field;
			if ( stringSortingFields.includes( fieldId ) ) {
				const fieldToSort = fields.find( ( field ) => {
					return field.id === fieldId;
				} );
				filteredData.sort( ( a, b ) => {
					const valueA = fieldToSort.getValue( { item: a } ) ?? '';
					const valueB = fieldToSort.getValue( { item: b } ) ?? '';
					return view.sort.direction === 'asc'
						? valueA.localeCompare( valueB )
						: valueB.localeCompare( valueA );
				} );
			}
		}
		// Handle pagination.
		const start = ( view.page - 1 ) * view.perPage;
		const totalItems = filteredData?.length || 0;
		filteredData = filteredData?.slice( start, start + view.perPage );
		return {
			shownData: filteredData,
			paginationInfo: {
				totalItems,
				totalPages: Math.ceil( totalItems / view.perPage ),
			},
		};
	}, [ view ] );
	const onChangeView = useCallback(
		( viewUpdater ) => {
			let updatedView =
				typeof viewUpdater === 'function'
					? viewUpdater( view )
					: viewUpdater;
			if ( updatedView.type !== view.type ) {
				updatedView = {
					...updatedView,
					layout: {
						...defaultConfigPerViewType[ updatedView.type ],
					},
				};
			}

			setView( updatedView );
		},
		[ view, setView ]
	);
	return (
		<DataViews
			{ ...props }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ onChangeView }
		/>
	);
};
Default.args = {
	actions,
	getItemId: ( item ) => item.id,
	isLoading: false,
	supportedLayouts: [ LAYOUT_TABLE, LAYOUT_GRID ],
};
