import { afterEach, describe, expect, it } from 'vitest';
import getRectangleFromRange from '../get-rectangle-from-range';

describe( 'getRectangleFromRange', () => {
	afterEach( () => {
		delete window.Range.prototype.getClientRects;
		document.body.innerHTML = '';
	} );

	// jsdom does not lay out, and its ranges have no `getClientRects`: give
	// a collapsed range a rectangle by the text node and offset it starts
	// at, nothing otherwise.
	function rectsFor( entries ) {
		window.Range.prototype.getClientRects = function () {
			const match = entries.find(
				( [ node, offset ] ) =>
					node === this.startContainer && offset === this.startOffset
			);
			return match ? [ match[ 2 ] ] : [];
		};
	}

	function collapsedRange( node, offset ) {
		const range = document.createRange();
		range.setStart( node, offset );
		range.setEnd( node, offset );
		return range;
	}

	it( 'measures a position after the last child of an element at the end of its text', () => {
		document.body.innerHTML = '<div>wordpress.org</div>';
		const element = document.querySelector( 'div' );
		const text = element.firstChild;
		rectsFor( [ [ text, 13, new window.DOMRect( 120, 100, 0, 24 ) ] ] );
		const mutations = [];
		new window.MutationObserver( ( records ) =>
			mutations.push( ...records )
		).observe( element, { childList: true, subtree: true } );

		const range = collapsedRange( element, 1 );

		expect( getRectangleFromRange( range ) ).toMatchObject( {
			left: 120,
			top: 100,
			width: 0,
			height: 24,
		} );
		expect( range.startContainer ).toBe( element );
		return Promise.resolve().then( () => {
			expect( mutations ).toEqual( [] );
		} );
	} );

	it( 'measures a position before the first child of an element at the start of its text', () => {
		document.body.innerHTML = '<div><em>abc</em>def</div>';
		const element = document.querySelector( 'div' );
		const text = element.querySelector( 'em' ).firstChild;
		rectsFor( [ [ text, 0, new window.DOMRect( 8, 100, 0, 24 ) ] ] );

		expect(
			getRectangleFromRange( collapsedRange( element, 0 ) )
		).toMatchObject( { left: 8, top: 100, height: 24 } );
	} );

	it( 'measures a position after a line break at the start of the next line', () => {
		document.body.innerHTML = '<p>abc<br>def</p>';
		const paragraph = document.querySelector( 'p' );
		const nextLine = paragraph.lastChild;
		rectsFor( [
			[ paragraph.firstChild, 3, new window.DOMRect( 40, 100, 0, 24 ) ],
			[ nextLine, 0, new window.DOMRect( 8, 124, 0, 24 ) ],
		] );

		expect(
			getRectangleFromRange( collapsedRange( paragraph, 2 ) )
		).toMatchObject( { left: 8, top: 124, height: 24 } );
	} );

	it( 'measures a position inside an empty inline element beside the text next to it', () => {
		document.body.innerHTML =
			'<p>﻿<span data-rich-text-placeholder="Type" style="display:inline"></span></p>';
		const paragraph = document.querySelector( 'p' );
		const placeholder = paragraph.querySelector( 'span' );
		rectsFor( [
			[ paragraph.firstChild, 1, new window.DOMRect( 8, 100, 0, 24 ) ],
		] );

		expect(
			getRectangleFromRange( collapsedRange( placeholder, 0 ) )
		).toMatchObject( { left: 8, top: 100, height: 24 } );
	} );

	it( 'does not measure a position inside an empty block element from outside it', () => {
		document.body.innerHTML = '<div>abc<p></p></div>';
		const paragraph = document.querySelector( 'p' );
		rectsFor( [
			[
				document.querySelector( 'div' ).firstChild,
				3,
				new window.DOMRect( 40, 100, 0, 24 ),
			],
		] );

		expect(
			getRectangleFromRange( collapsedRange( paragraph, 0 ) )
		).toBeNull();
	} );

	it( 'returns null for a position with no text on either side', () => {
		document.body.innerHTML = '<p><br></p>';
		const paragraph = document.querySelector( 'p' );
		rectsFor( [] );

		expect(
			getRectangleFromRange( collapsedRange( paragraph, 1 ) )
		).toBeNull();
		expect( paragraph.innerHTML ).toBe( '<br>' );
	} );
} );
