/**
 * Internal dependencies
 */
import { isHorizontalEdge, placeCaretAtHorizontalEdge, isInputField } from '../dom';

describe( 'DOM', () => {
	let parent;

	beforeEach( () => {
		parent = document.createElement( 'div' );
		document.body.appendChild( parent );
	} );

	afterEach( () => {
		parent.remove();
	} );

	describe( 'isHorizontalEdge', () => {
		it( 'Should return true for empty input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.focus();
			expect( isHorizontalEdge( input, true ) ).toBe( true );
			expect( isHorizontalEdge( input, false ) ).toBe( true );
		} );

		it( 'Should return the right values if we focus the end of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 5;
			input.selectionEnd = 5;
			expect( isHorizontalEdge( input, true ) ).toBe( false );
			expect( isHorizontalEdge( input, false ) ).toBe( true );
		} );

		it( 'Should return the right values if we focus the start of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 0;
			expect( isHorizontalEdge( input, true ) ).toBe( true );
			expect( isHorizontalEdge( input, false ) ).toBe( false );
		} );

		it( 'Should return false if we\'re not at the edge', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 3;
			input.selectionEnd = 3;
			expect( isHorizontalEdge( input, true ) ).toBe( false );
			expect( isHorizontalEdge( input, false ) ).toBe( false );
		} );

		it( 'Should return false if the selection is not collapseds', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 5;
			expect( isHorizontalEdge( input, true ) ).toBe( false );
			expect( isHorizontalEdge( input, false ) ).toBe( false );
		} );

		it( 'Should always return true for non content editabless', () => {
			const div = document.createElement( 'div' );
			parent.appendChild( div );
			expect( isHorizontalEdge( div, true ) ).toBe( true );
			expect( isHorizontalEdge( div, false ) ).toBe( true );
		} );
	} );

	describe( 'placeCaretAtHorizontalEdge', () => {
		it( 'should place caret at the start of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtHorizontalEdge( input, true );
			expect( isHorizontalEdge( input, false ) ).toBe( true );
		} );

		it( 'should place caret at the end of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtHorizontalEdge( input, false );
			expect( isHorizontalEdge( input, true ) ).toBe( true );
		} );
	} );

	describe( 'isInputfield', () => {
		it( 'should return true for an input element', () => {
			expect( isInputField( document.createElement( 'input' ) ) ).toBe( true );
		} );

		it( 'should return true for an textarea element', () => {
			expect( isInputField( document.createElement( 'textarea' ) ) ).toBe( true );
		} );

		it( 'should return true for a contenteditable element', () => {
			const div = document.createElement( 'div' );

			div.contentEditable = 'true';

			expect( isInputField( div ) ).toBe( true );
		} );

		it( 'should return true for a normal div element', () => {
			expect( isInputField( document.createElement( 'div' ) ) ).toBe( false );
		} );
	} );
} );
