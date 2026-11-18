import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getScrollContainer } from '@wordpress/dom';
import useListViewScrollIntoView from '../use-list-view-scroll-into-view';

vi.mock( '@wordpress/dom', () => ( { getScrollContainer: vi.fn() } ) );
globalThis.wpVitest.mockScrollIntoView();

describe( 'useListViewScrollIntoView', () => {
	it.each( [
		{
			description:
				'scrolls only the List View to reveal the selected row',
			rowTop: 550,
			expectedScrollTop: 600,
		},
		{
			description:
				'keeps the scroll position when the selected row is visible',
			rowTop: 150,
			expectedScrollTop: 100,
		},
	] )( '$description', ( { rowTop, expectedScrollTop } ) => {
		const container = document.body.appendChild(
			document.createElement( 'div' )
		);
		onTestFinished( () => container.remove() );
		const row = container.appendChild( document.createElement( 'div' ) );
		vi.mocked( getScrollContainer ).mockReturnValue( container );
		container.scrollTop = 100;
		container.getBoundingClientRect = () => new DOMRect( 0, 50, 100, 300 );
		row.getBoundingClientRect = () => new DOMRect( 0, rowTop, 100, 32 );

		renderHook( () =>
			useListViewScrollIntoView( {
				isSelected: true,
				selectedClientIds: [ 'block-1' ],
				rowItemRef: { current: row },
			} )
		);

		expect( container.scrollTop ).toBe( expectedScrollTop );
		expect( Element.prototype.scrollIntoView ).not.toHaveBeenCalled();
	} );
} );
