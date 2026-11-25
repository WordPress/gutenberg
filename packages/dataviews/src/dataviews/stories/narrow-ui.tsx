import { useState, useMemo, useEffect } from '@wordpress/element';
import DataViews from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { actions, data, fields } from './fixtures';
import styles from './style.module.css';

const DEFAULT_VIEW: View = {
	type: 'list',
	search: '',
	page: 1,
	perPage: 10,
	filters: [],
	fields: [ 'categories' ],
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'image',
};

const NarrowUIComponent = ( {
	layout = 'list',
	tabsField = 'type',
	showSort = true,
}: {
	layout: 'list' | 'grid';
	tabsField: 'none' | 'type' | 'categories';
	showSort: boolean;
} ) => {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const defaultView = useMemo(
		() => ( { ...DEFAULT_VIEW, type: layout } ) as View,
		[ layout ]
	);

	useEffect( () => {
		setView( ( prevView ) => ( { ...prevView, type: layout } ) as View );
	}, [ layout ] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	const isModified = JSON.stringify( view ) !== JSON.stringify( defaultView );

	return (
		<div className={ styles[ 'narrow-panel' ] }>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ fields }
				actions={ actions }
				onChangeView={ setView }
				defaultLayouts={ { [ layout ]: {} } }
				onReset={ isModified ? () => setView( defaultView ) : false }
			>
				<DataViews.NarrowUI
					tabsField={ tabsField === 'none' ? undefined : tabsField }
					showSort={ showSort }
				/>
			</DataViews>
		</div>
	);
};

export default NarrowUIComponent;
