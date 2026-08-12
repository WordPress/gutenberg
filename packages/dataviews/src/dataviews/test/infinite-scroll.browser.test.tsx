import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
	startPosition: 1,
	perPage: 1,
	layout: {},
	filters: [],
	fields: [ 'title' ],
	titleField: 'title',
	infiniteScrollEnabled: true,
};

describe( 'DataViews browser scrolling', () => {
	it( 'loads the next page when the layout scrolls near the bottom', async () => {
		const onChangeView = vi.fn();
		const { container } = render(
			<DataViews< Data >
				view={ view }
				onChangeView={ onChangeView }
				fields={ [
					{
						id: 'title',
						label: 'Title',
						type: 'text',
						render: ( { item } ) => (
							<div style={ { height: 200 } }>{ item.title }</div>
						),
					},
				] }
				data={ [ { id: 1, title: 'First item' } ] }
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ { totalItems: 3, totalPages: 3 } }
				defaultLayouts={ { [ LAYOUT_GRID ]: true } }
			/>
		);

		// Direct DOM access is intentional: the production scroll listener is
		// attached to this internal layout container.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const layoutContainer = container.querySelector< HTMLDivElement >(
			'.dataviews-layout__container'
		);
		expect( layoutContainer ).toBeInstanceOf( HTMLDivElement );

		Object.assign( layoutContainer!.style, {
			height: '40px',
			overflow: 'auto',
		} );

		await waitFor( () => {
			expect( layoutContainer!.scrollHeight ).toBeGreaterThan(
				layoutContainer!.clientHeight
			);
		} );

		layoutContainer!.scrollTop = layoutContainer!.scrollHeight;
		fireEvent.scroll( layoutContainer! );

		await waitFor( () => {
			expect( onChangeView ).toHaveBeenCalledWith(
				expect.objectContaining( {
					infiniteScrollEnabled: true,
					startPosition: 2,
				} )
			);
		} );
	} );
} );
