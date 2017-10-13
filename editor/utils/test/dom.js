/**
 * Internal dependencies
 */
import { isEdge, placeCaretAtEdge } from '../dom';

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
			expect( isEdge( { container: input, start: true } ) ).toBe( true );
			expect( isEdge( { container: input, start: false } ) ).toBe( true );
		} );

		it( 'Should return the right values if we focus the end of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 5;
			input.selectionEnd = 5;
			expect( isEdge( { container: input, start: true } ) ).toBe( false );
			expect( isEdge( { container: input, start: false } ) ).toBe( true );
		} );

		it( 'Should return the right values if we focus the start of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 0;
			expect( isEdge( { container: input, start: true } ) ).toBe( true );
			expect( isEdge( { container: input, start: false } ) ).toBe( false );
		} );

		it( 'Should return false if we\'re not at the edge', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 3;
			input.selectionEnd = 3;
			expect( isEdge( { container: input, start: true } ) ).toBe( false );
			expect( isEdge( { container: input, start: false } ) ).toBe( false );
		} );

		it( 'Should return false if the selection is not collapseds', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 5;
			expect( isEdge( { container: input, start: true } ) ).toBe( false );
			expect( isEdge( { container: input, start: false } ) ).toBe( false );
		} );

		it( 'Should always return true for non content editabless', () => {
			const div = document.createElement( 'div' );
			parent.appendChild( div );
			expect( isEdge( { container: div, start: true } ) ).toBe( true );
			expect( isEdge( { container: div, start: false } ) ).toBe( true );
		} );
	} );

	describe( 'placeCaretAtEdge', () => {
		it( 'should place caret at the start of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtEdge( { container: input, start: true } );
			expect( isEdge( { container: input, start: true } ) ).toBe( true );
		} );

		it( 'should place caret at the end of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtEdge( { container: input, start: false } );
			expect( isEdge( { container: input, start: false } ) ).toBe( true );
		} );
	} );
} );
