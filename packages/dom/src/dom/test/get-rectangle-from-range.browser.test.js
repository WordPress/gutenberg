import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import getRectangleFromRange from '../get-rectangle-from-range';

describe( 'getRectangleFromRange', () => {
	let container;

	beforeEach( () => {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
	} );

	afterEach( () => {
		container.remove();
	} );

	function collapsedRange( node, offset ) {
		const range = document.createRange();
		range.setStart( node, offset );
		range.collapse( true );
		return range;
	}

	// The caret rectangle the browser gives for a position in a text node.
	function caretBox( node, offset ) {
		return collapsedRange( node, offset ).getClientRects()[ 0 ].toJSON();
	}

	function box( rect ) {
		return rect.toJSON();
	}

	it( 'measures a position after the last child of an element at the end of its text', () => {
		container.innerHTML = '<div>wordpress.org</div>';
		const element = container.firstChild;
		const range = collapsedRange( element, 1 );
		const mutations = [];
		new window.MutationObserver( ( records ) =>
			mutations.push( ...records )
		).observe( element, { childList: true, subtree: true } );

		expect( range.getClientRects() ).toHaveLength( 0 );
		expect( box( getRectangleFromRange( range ) ) ).toEqual(
			caretBox( element.firstChild, 13 )
		);
		expect( range.startContainer ).toBe( element );
		return Promise.resolve().then( () => {
			expect( mutations ).toEqual( [] );
		} );
	} );

	it( 'measures a position before the first child of an element at the start of its text', () => {
		container.innerHTML = '<div><em>abc</em>def</div>';
		const element = container.firstChild;

		expect(
			box( getRectangleFromRange( collapsedRange( element, 0 ) ) )
		).toEqual( caretBox( element.querySelector( 'em' ).firstChild, 0 ) );
	} );

	it( 'measures a position after a line break at the start of the next line', () => {
		container.innerHTML = '<p>abc<br>def</p>';
		const paragraph = container.firstChild;
		const nextLine = caretBox( paragraph.lastChild, 0 );

		expect( nextLine.top ).toBeGreaterThan(
			caretBox( paragraph.firstChild, 3 ).top
		);
		expect(
			box( getRectangleFromRange( collapsedRange( paragraph, 2 ) ) )
		).toEqual( nextLine );
	} );

	it( 'returns null for a position between texts on different lines', () => {
		container.innerHTML =
			'<p style="width: 3ch; font-family: monospace; overflow-wrap: anywhere;">abc<em>def</em></p>';
		const paragraph = container.firstChild;

		expect(
			caretBox( paragraph.lastChild.firstChild, 0 ).top
		).toBeGreaterThan( caretBox( paragraph.firstChild, 3 ).top );
		expect(
			getRectangleFromRange( collapsedRange( paragraph, 1 ) )
		).toBeNull();
	} );

	it( 'measures a position between texts on the same line', () => {
		container.innerHTML = '<p>abc<em>def</em></p>';
		const paragraph = container.firstChild;

		expect(
			box( getRectangleFromRange( collapsedRange( paragraph, 1 ) ) )
		).toEqual( caretBox( paragraph.lastChild.firstChild, 0 ) );
	} );

	it( 'measures a position inside an empty inline element beside the text next to it', () => {
		container.innerHTML =
			'<p>﻿<span data-rich-text-placeholder="Type"></span></p>';
		const paragraph = container.firstChild;
		const placeholder = paragraph.querySelector( 'span' );

		expect(
			box( getRectangleFromRange( collapsedRange( placeholder, 0 ) ) )
		).toEqual( caretBox( paragraph.firstChild, 1 ) );
	} );

	it( 'measures a position inside a line break at the end of the text before it', () => {
		container.innerHTML = '<p>abc<br>def</p>';
		const paragraph = container.firstChild;

		expect(
			box(
				getRectangleFromRange(
					collapsedRange( paragraph.querySelector( 'br' ), 0 )
				)
			)
		).toEqual( caretBox( paragraph.firstChild, 3 ) );
	} );

	it( 'returns null for a position with no text on either side', () => {
		container.innerHTML = '<p><br></p>';
		const paragraph = container.firstChild;

		expect(
			getRectangleFromRange( collapsedRange( paragraph, 1 ) )
		).toBeNull();
		expect( paragraph.innerHTML ).toBe( '<br>' );
	} );
} );
