/**
 * Internal dependencies
 */
import { createBoardStore } from '../board-store';

function mockRect( element, top ) {
	element.getBoundingClientRect = () => ( { top } );
}

describe( 'createBoardStore', () => {
	describe( 'getBlockRects', () => {
		it( 'anchors an inline note to its in-content marker', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.innerHTML =
				'Some <mark class="wp-note" data-id="12">noted</mark> text';
			mockRect( blockEl, 100 );
			mockRect( blockEl.querySelector( 'mark' ), 160 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);

			expect( store.getBlockRects()[ 12 ].top ).toBe( 160 );
		} );

		it( 'falls back to the block rect for block-level notes', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.textContent = 'No marker here';
			mockRect( blockEl, 100 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);

			expect( store.getBlockRects()[ 12 ].top ).toBe( 100 );
		} );

		it( 'ignores markers belonging to other notes', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.innerHTML =
				'Some <mark class="wp-note" data-id="34">other note</mark> text';
			mockRect( blockEl, 100 );
			mockRect( blockEl.querySelector( 'mark' ), 160 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);

			expect( store.getBlockRects()[ 12 ].top ).toBe( 100 );
		} );

		it( 'anchors each note to its own marker within the same block', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.innerHTML =
				'One <mark class="wp-note" data-id="12">first</mark> and ' +
				'another <mark class="wp-note" data-id="34">second</mark> note';
			const [ first, second ] = blockEl.querySelectorAll( 'mark' );
			mockRect( blockEl, 100 );
			mockRect( first, 120 );
			mockRect( second, 180 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);
			store.registerThread(
				34,
				blockEl,
				document.createElement( 'div' )
			);

			const rects = store.getBlockRects();
			expect( rects[ 12 ].top ).toBe( 120 );
			expect( rects[ 34 ].top ).toBe( 180 );
		} );
	} );
} );
