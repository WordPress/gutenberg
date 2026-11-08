import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { useLayoutEffect } from '@wordpress/element';
import DataViews from '../index';
import { LAYOUT_GRID } from '../../constants';
import type { View } from '../../types';

type Data = {
	id: number;
	title: string;
};

const view: View = {
	type: LAYOUT_GRID,
	search: '',
	page: 1,
	perPage: 10,
	layout: {},
	filters: [],
	fields: [ 'title' ],
	titleField: 'title',
};

const data: Data[] = [
	{ id: 1, title: 'First item' },
	{ id: 2, title: 'Second item' },
	{ id: 3, title: 'Third item' },
];

// Counts the grid rows in the first animation frame after mount. Animation
// frame callbacks run before resize observer callbacks, so this is the layout
// the browser paints first.
function FirstFrameRowCount( {
	onCount,
}: {
	onCount: ( count: number ) => void;
} ) {
	useLayoutEffect( () => {
		requestAnimationFrame( () => {
			onCount( screen.queryAllByRole( 'row' ).length );
		} );
	}, [ onCount ] );
	return null;
}

describe( 'DataViews grid columns', () => {
	it( 'paints the grid at its real column count on the first frame', async () => {
		let firstFrameRowCount: number | undefined;

		// A 600px wide container fits two columns at the default 230px preview
		// size, so the three items render as two rows.
		await render(
			<div style={ { width: 600 } }>
				<DataViews< Data >
					view={ view }
					onChangeView={ () => {} }
					fields={ [ { id: 'title', label: 'Title', type: 'text' } ] }
					data={ data }
					getItemId={ ( item ) => item.id.toString() }
					paginationInfo={ { totalItems: 3, totalPages: 1 } }
					defaultLayouts={ { [ LAYOUT_GRID ]: true } }
				/>
				<FirstFrameRowCount
					onCount={ ( count ) => {
						if ( firstFrameRowCount === undefined ) {
							firstFrameRowCount = count;
						}
					} }
				/>
			</div>
		);

		await waitFor( () => expect( firstFrameRowCount ).toBe( 2 ) );

		// The observer reports the same width, so nothing changes.
		expect( screen.getAllByRole( 'row' ) ).toHaveLength( 2 );
	} );
} );
