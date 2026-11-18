import { describe, expect, it, onTestFinished } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useListViewScrollIntoView from '../use-list-view-scroll-into-view';

describe( 'useListViewScrollIntoView', () => {
	it.each( [
		{ position: 'below', rowIndex: 10, scrollTop: 0 },
		{ position: 'above', rowIndex: 1, scrollTop: 320 },
	] )(
		'reveals a row $position the List View without scrolling the page',
		async ( { rowIndex, scrollTop } ) => {
			const fixture = document.body.appendChild(
				document.createElement( 'div' )
			);
			onTestFinished( () => {
				fixture.remove();
				window.scrollTo( 0, 0 );
			} );
			fixture.style.height = '300vh';
			fixture.style.paddingTop = '100vh';
			const container = fixture.appendChild(
				document.createElement( 'div' )
			);
			container.style.height = '100px';
			container.style.overflowY = 'auto';
			const rows = Array.from( { length: 20 }, () => {
				const row = container.appendChild(
					document.createElement( 'div' )
				);
				row.style.height = '32px';
				return row;
			} );
			const row = rows[ rowIndex ];
			container.scrollTop = scrollTop;
			window.scrollTo( 0, window.innerHeight - 50 );
			const initialScrollY = window.scrollY;

			await renderHook( () =>
				useListViewScrollIntoView( {
					isSelected: true,
					selectedClientIds: [ 'block-1' ],
					rowItemRef: { current: row },
				} )
			);

			expect( row.getBoundingClientRect().top ).toBeCloseTo(
				container.getBoundingClientRect().top
			);
			expect( window.scrollY ).toBe( initialScrollY );
		}
	);
} );
