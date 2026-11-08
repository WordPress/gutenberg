import { useMemo, useState } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_TABLE } from '../../constants';
import type { Field, View } from '../../types';

type Item = {
	id: number;
	title: string;
};

const fields: Field< Item >[] = [
	{
		id: 'title',
		label: 'Title',
		type: 'text',
	},
];

/**
 * A dataset far too large to hold in memory, the way a server-backed consumer
 * reports it: `paginationInfo` carries the totals and `data` holds only the
 * current page. Above 100 pages the footer offers a page number input instead
 * of a select listing every page.
 */
export const LargePageCountComponent = ( {
	totalItems = 1453038,
}: {
	totalItems?: number;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		page: 1,
		perPage: 20,
		fields: [],
		titleField: 'title',
	} );

	const page = view.page ?? 1;
	const perPage = view.perPage ?? 20;
	const { data, paginationInfo } = useMemo( () => {
		const first = ( page - 1 ) * perPage + 1;
		const count = Math.max(
			0,
			Math.min( perPage, totalItems - first + 1 )
		);
		return {
			data: Array.from( { length: count }, ( _, i ) => ( {
				id: first + i,
				title: `Item ${ first + i }`,
			} ) ),
			paginationInfo: {
				totalItems,
				totalPages: Math.ceil( totalItems / perPage ),
			},
		};
	}, [ page, perPage, totalItems ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ data }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
		/>
	);
};

export default LargePageCountComponent;
