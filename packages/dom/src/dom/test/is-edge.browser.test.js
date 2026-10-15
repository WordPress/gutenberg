import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import isEdge from '../is-edge';

describe( 'isEdge', () => {
	let container;

	beforeEach( () => {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
	} );

	afterEach( () => {
		container.remove();
		window.scrollTo( 0, 0 );
	} );

	function setCaret( node, offset ) {
		const range = document.createRange();
		range.setStart( node, offset );
		range.collapse( true );
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange( range );
	}

	it( 'returns true when caret is at the bottom edge of a paragraph near the viewport bottom', () => {
		const spacerTop = document.createElement( 'div' );
		spacerTop.style.height = `${ window.innerHeight }px`;
		container.appendChild( spacerTop );

		const p = document.createElement( 'p' );
		p.contentEditable = 'true';
		p.style.margin = '0';
		p.style.padding = '8px';
		p.style.lineHeight = '20px';
		p.textContent = 'Single line paragraph';
		container.appendChild( p );

		const spacerBottom = document.createElement( 'div' );
		spacerBottom.style.height = `${ window.innerHeight }px`;
		container.appendChild( spacerBottom );

		setCaret( p.firstChild, p.textContent.length );

		const pTopDoc = p.offsetTop;
		const pBottomDoc = pTopDoc + p.offsetHeight;
		// Scroll so that p's bottom edge is 6px below viewport bottom.
		window.scrollTo( 0, pBottomDoc - window.innerHeight - 6 );

		const containerRect = p.getBoundingClientRect();
		const selection = window.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt( 0 ) : null;
		const rangeRect = range.getBoundingClientRect();

		// Ensure our test geometry matches the reproduction condition:
		expect( containerRect.height ).toBeLessThan( window.innerHeight );
		expect( rangeRect.bottom ).toBeLessThanOrEqual( window.innerHeight );
		expect( containerRect.bottom ).toBeGreaterThan( window.innerHeight );

		// Selection is at the bottom vertical edge of the paragraph.
		expect( isEdge( p, false, true ) ).toBe( true );
	} );

	it( 'returns false without scrolling when caret is in the middle of a block taller than the viewport', () => {
		const pre = document.createElement( 'pre' );
		pre.contentEditable = 'true';
		pre.style.margin = '0';
		pre.style.padding = '0';
		pre.style.lineHeight = '30px';
		pre.style.fontSize = '16px';

		const lines = Array.from(
			{ length: 80 },
			( _, i ) => `Line ${ i }`
		).join( '\n' );
		pre.textContent = lines;
		container.appendChild( pre );

		// Middle line is around line 40, which is at y = 40 * 30 = 1200px.
		// Scroll so that line 40 is roughly in the middle of the viewport.
		const targetY = 40 * 30;
		window.scrollTo( 0, targetY - window.innerHeight / 2 );

		// Find the text node offset for Line 40
		const targetOffset = lines.indexOf( 'Line 40' );
		setCaret( pre.firstChild, targetOffset );

		const selection = window.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt( 0 ) : null;
		const rangeRect = range.getBoundingClientRect();
		const preRect = pre.getBoundingClientRect();

		expect( preRect.height ).toBeGreaterThan( window.innerHeight );
		expect( rangeRect.top ).toBeGreaterThanOrEqual( 0 );
		expect( rangeRect.bottom ).toBeLessThanOrEqual( window.innerHeight );

		const scrollBefore = window.scrollY;

		// Check vertical edge forward (down arrow)
		const result = isEdge( pre, false, true );

		expect( result ).toBe( false );
		expect( window.scrollY ).toBe( scrollBefore );
	} );

	it( 'returns true when caret is at the top edge of a paragraph near the viewport top', () => {
		const spacerTop = document.createElement( 'div' );
		spacerTop.style.height = `${ window.innerHeight }px`;
		container.appendChild( spacerTop );

		const p = document.createElement( 'p' );
		p.contentEditable = 'true';
		p.style.margin = '0';
		p.style.padding = '8px';
		p.style.lineHeight = '20px';
		p.textContent = 'Single line paragraph';
		container.appendChild( p );

		const spacerBottom = document.createElement( 'div' );
		spacerBottom.style.height = `${ window.innerHeight }px`;
		container.appendChild( spacerBottom );

		setCaret( p.firstChild, 0 );

		const pTopDoc = p.offsetTop;
		// Scroll so that p's top edge is 6px above viewport top.
		window.scrollTo( 0, pTopDoc + 6 );

		const containerRect = p.getBoundingClientRect();
		const selection = window.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt( 0 ) : null;
		const rangeRect = range.getBoundingClientRect();

		expect( containerRect.height ).toBeLessThan( window.innerHeight );
		expect( containerRect.top ).toBeLessThan( 0 );
		expect( rangeRect.top ).toBeGreaterThanOrEqual( 0 );

		// Selection is at the top vertical edge of the paragraph.
		expect( isEdge( p, true, true ) ).toBe( true );
	} );

	it( 'returns true when caret is on the last line of a block taller than the viewport', () => {
		const pre = document.createElement( 'pre' );
		pre.contentEditable = 'true';
		pre.style.margin = '0';
		pre.style.padding = '10px';
		pre.style.lineHeight = '30px';
		pre.style.fontSize = '16px';

		const lines = Array.from(
			{ length: 80 },
			( _, i ) => `Line ${ i }`
		).join( '\n' );
		pre.textContent = lines;
		container.appendChild( pre );

		// Put caret at the end of the last line
		setCaret( pre.firstChild, lines.length );

		// Scroll to the bottom so the last line is in view
		const preBottom = pre.offsetTop + pre.offsetHeight;
		window.scrollTo( 0, preBottom - window.innerHeight + 5 );

		const preRect = pre.getBoundingClientRect();
		expect( preRect.height ).toBeGreaterThan( window.innerHeight );

		// Caret is on the last line, so it IS at the bottom vertical edge
		expect( isEdge( pre, false, true ) ).toBe( true );
	} );

	it( 'returns true when caret is on the first line of a block taller than the viewport', () => {
		const pre = document.createElement( 'pre' );
		pre.contentEditable = 'true';
		pre.style.margin = '0';
		pre.style.padding = '10px';
		pre.style.lineHeight = '30px';
		pre.style.fontSize = '16px';

		const lines = Array.from(
			{ length: 80 },
			( _, i ) => `Line ${ i }`
		).join( '\n' );
		pre.textContent = lines;
		container.appendChild( pre );

		// Put caret on the first line (Line 0)
		setCaret( pre.firstChild, 0 );

		// Scroll so the first line is in view
		window.scrollTo( 0, pre.offsetTop - 5 );

		const preRect = pre.getBoundingClientRect();
		expect( preRect.height ).toBeGreaterThan( window.innerHeight );

		// Caret is on the first line, so it IS at the top vertical edge
		expect( isEdge( pre, true, true ) ).toBe( true );
	} );

	it( 'returns false without scrolling when caret is in the middle of a block wider than the viewport', () => {
		const pre = document.createElement( 'pre' );
		pre.contentEditable = 'true';
		pre.style.margin = '0';
		pre.style.padding = '0';
		pre.style.whiteSpace = 'pre';
		pre.style.width = `${ window.innerWidth * 3 }px`;

		const text = 'A'.repeat( 300 );
		pre.textContent = text;
		container.appendChild( pre );

		// Middle offset
		setCaret( pre.firstChild, 150 );

		// Scroll horizontally so caret is in middle of viewport
		window.scrollTo( window.innerWidth, 0 );

		const scrollXBefore = window.scrollX;

		// Check horizontal edge forward (right arrow)
		const result = isEdge( pre, false, false );

		expect( result ).toBe( false );
		expect( window.scrollX ).toBe( scrollXBefore );
	} );
} );
