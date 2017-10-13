/**
 * Internal dependencies
 */
import { isEdge, placeCaretAtEdge, isAtCursorStart, isAtCursorEnd } from '../dom';

describe( 'DOM', () => {
	let parent;

	beforeEach( () => {
		parent = document.createElement( 'div' );
		document.body.appendChild( parent );
	} );

	afterEach( () => {
		parent.remove();
	} );

	describe( 'isEdge', () => {
		it( 'Should return true for empty input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.focus();
			expect( isEdge( input, true ) ).toBe( true );
			expect( isEdge( input, false ) ).toBe( true );
		} );

		it( 'Should return the right values if we focus the end of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 5;
			input.selectionEnd = 5;
			expect( isEdge( input, true ) ).toBe( false );
			expect( isEdge( input, false ) ).toBe( true );
		} );

		it( 'Should return the right values if we focus the start of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 0;
			expect( isEdge( input, true ) ).toBe( true );
			expect( isEdge( input, false ) ).toBe( false );
		} );

		it( 'Should return false if we\'re not at the edge', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 3;
			input.selectionEnd = 3;
			expect( isEdge( input, true ) ).toBe( false );
			expect( isEdge( input, false ) ).toBe( false );
		} );

		it( 'Should return false if the selection is not collapseds', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 5;
			expect( isEdge( input, true ) ).toBe( false );
			expect( isEdge( input, false ) ).toBe( false );
		} );

		it( 'Should always return true for non content editabless', () => {
			const div = document.createElement( 'div' );
			parent.appendChild( div );
			expect( isEdge( div, true ) ).toBe( true );
			expect( isEdge( div, false ) ).toBe( true );
		} );
	} );

	describe( 'placeCaretAtEdge', () => {
		it( 'should place caret at the start of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtEdge( input, true );
			expect( isEdge( input, true ) ).toBe( true );
		} );

		it( 'should place caret at the end of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtEdge( input, false );
			expect( isEdge( input, false ) ).toBe( true );
		} );
	} );

	describe( 'isAtCursorStart', () => {
		it( 'should consider 0 to be the start of an empty text node', () => {
			const node = document.createTextNode( '' );
			expect( isAtCursorStart( node, 0 ) ).toBe( true );
			expect( isAtCursorStart( node, 1 ) ).toBe( false );
		} );

		it( 'should consider 0 to be the start of a non-empty text node', () => {
			const node = document.createTextNode( 'not-empty' );
			expect( isAtCursorStart( node, 0 ) ).toBe( true );
			expect( isAtCursorStart( node, 1 ) ).toBe( false );
		} );

		it( 'should consider 0 to be the start of an empty div', () => {
			const node = document.createElement( 'div' );
			expect( isAtCursorStart( node, 0 ) ).toBe( true );
			expect( isAtCursorStart( node, 1 ) ).toBe( false );
		} );

		it( 'should consider 0 to be the start of an non-empty div', () => {
			const node = document.createElement( 'div' );
			node.innerHTML = 'text';
			expect( isAtCursorStart( node, 0 ) ).toBe( true );
			expect( isAtCursorStart( node, 1 ) ).toBe( false );
		} );

		it( 'should consider 0 to be the start of a img', () => {
			const node = document.createElement( 'img' );
			expect( isAtCursorStart( node, 0 ) ).toBe( true );
			expect( isAtCursorStart( node, 1 ) ).toBe( false );
		} );
	} );

	describe( 'isAtCursorEnd', () => {
		it( 'should consider 0 to be the end of an empty text node', () => {
			const node = document.createTextNode( '' );
			expect( isAtCursorEnd( node, 0 ) ).toBe( true );
			expect( isAtCursorEnd( node, 1 ) ).toBe( false );
		} );

		it( 'should consider "not-empty".length to be the end of a non-empty text node', () => {
			const node = document.createTextNode( 'not-empty' );
			expect( isAtCursorEnd( node, 'not-empty'.length ) ).toBe( true );
			expect( isAtCursorEnd( node, 1 ) ).toBe( false );
		} );

		it( 'should consider 0 to be the end of an empty div', () => {
			const node = document.createElement( 'div' );
			expect( isAtCursorEnd( node, 0 ) ).toBe( true );
			expect( isAtCursorEnd( node, 1 ) ).toBe( false );
		} );

		it( 'should consider 1 to be the end of an non-empty div with a single text node', () => {
			const node = document.createElement( 'div' );
			node.innerHTML = 'text';
			expect( isAtCursorEnd( node, 1 ) ).toBe( true );
			expect( isAtCursorEnd( node, 'text'.length ) ).toBe( false );
		} );

		it( 'should consider 3 to be the end of an non-empty div with a three spans', () => {
			const node = document.createElement( 'div' );
			node.innerHTML = '<span>one</span><span>two</span><span>three</span>';
			expect( isAtCursorEnd( node, [ 'span', 'span', 'span' ].length ) ).toBe( true );
			expect( isAtCursorEnd( node, 'onetwothree'.length ) ).toBe( false );
		} );

		it( 'should consider 1 to be the end of a img', () => {
			const node = document.createElement( 'img' );
			expect( isAtCursorEnd( node, 0 ) ).toBe( false );
			expect( isAtCursorEnd( node, 1 ) ).toBe( true );
		} );
	} );
} );
