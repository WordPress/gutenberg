import { describe, expect, it } from 'vitest';
import { getNoteMarkerSelector, getNoteAnchorRect } from '../utils/dom';
import { noteFormat } from '../format';

describe( 'getNoteMarkerSelector', () => {
	it( 'targets the note marker by id', () => {
		expect( getNoteMarkerSelector( 12 ) ).toBe(
			'mark.wp-note[data-id="12"]'
		);
		expect( getNoteMarkerSelector( '12' ) ).toBe(
			'mark.wp-note[data-id="12"]'
		);
	} );

	it( 'escapes quotes and backslashes', () => {
		expect( getNoteMarkerSelector( '1"2\\3' ) ).toBe(
			'mark.wp-note[data-id="1\\"2\\\\3"]'
		);
	} );
} );

describe( 'getNoteMarkerSelector / noteFormat', () => {
	it( 'matches the shape the note format actually serializes', () => {
		// The selector is hand-written rather than derived, so lock it to the
		// format definition: a change to tagName/className/data-id there must
		// fail here rather than silently degrade every thread to block-top
		// alignment via getAnchorRects' fallback.
		const marker = document.createElement( noteFormat.tagName );
		marker.className = noteFormat.className;
		marker.setAttribute( noteFormat.attributes[ 'data-id' ], '7' );

		expect( marker.matches( getNoteMarkerSelector( 7 ) ) ).toBe( true );
	} );
} );

function mockRect( element: Element, top: number ) {
	element.getBoundingClientRect = () => ( { top } ) as DOMRect;
}

describe( 'getNoteAnchorRect', () => {
	it( 'anchors an inline note to its in-content marker', () => {
		const blockEl = document.createElement( 'p' );
		blockEl.innerHTML =
			'Some <mark class="wp-note" data-id="12">noted</mark> text';
		mockRect( blockEl, 100 );
		mockRect( blockEl.querySelector( 'mark' )!, 160 );

		expect( getNoteAnchorRect( 12, blockEl ).top ).toBe( 160 );
	} );

	it( 'falls back to the block rect for block-level notes', () => {
		const blockEl = document.createElement( 'p' );
		blockEl.textContent = 'No marker here';
		mockRect( blockEl, 100 );

		expect( getNoteAnchorRect( 12, blockEl ).top ).toBe( 100 );
	} );

	it( 'stops at the outermost block when no block is visible', () => {
		const outerEl = document.createElement( 'div' );
		outerEl.dataset.block = 'outer';
		outerEl.innerHTML = '<p data-block="inner">Hidden</p>';
		const blockEl = outerEl.querySelector( 'p' )!;
		mockRect( outerEl, 40 );
		mockRect( blockEl, 100 );
		outerEl.checkVisibility = () => false;
		blockEl.checkVisibility = () => false;

		expect( getNoteAnchorRect( 12, blockEl ).top ).toBe( 40 );
	} );

	it( 'anchors a marker split into several runs to its first run', () => {
		const blockEl = document.createElement( 'p' );
		/*
		 * Overlapping notes split a marker into several runs sharing the
		 * same data-id (see applyNoteFormat): the overlapped stretch nests
		 * inside the other note's marker. Each note anchors to its first
		 * run in document order.
		 */
		blockEl.innerHTML =
			'One <mark class="wp-note" data-id="12">first run</mark>' +
			'<mark class="wp-note" data-id="34">' +
			'<mark class="wp-note" data-id="12">overlap</mark>' +
			' tail</mark> text';
		const [ firstRun, outer, nestedRun ] =
			blockEl.querySelectorAll( 'mark' );
		mockRect( blockEl, 100 );
		mockRect( firstRun, 140 );
		mockRect( outer, 170 );
		mockRect( nestedRun, 200 );

		expect( getNoteAnchorRect( 12, blockEl ).top ).toBe( 140 );
		expect( getNoteAnchorRect( 34, blockEl ).top ).toBe( 170 );
	} );

	it( 'anchors each note to its own marker within the same block', () => {
		const blockEl = document.createElement( 'p' );
		blockEl.innerHTML =
			'One <mark class="wp-note" data-id="12">first</mark> and ' +
			'another <mark class="wp-note" data-id="34">second</mark> note';
		const [ first, second ] = blockEl.querySelectorAll( 'mark' );
		mockRect( blockEl, 100 );
		mockRect( first, 120 );
		mockRect( second, 180 );

		expect( getNoteAnchorRect( 12, blockEl ).top ).toBe( 120 );
		expect( getNoteAnchorRect( 34, blockEl ).top ).toBe( 180 );
	} );
} );
