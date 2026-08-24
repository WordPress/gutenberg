import focusRichTextAtPoint from '../focus-rich-text-at-point';

describe( 'focusRichTextAtPoint', () => {
	let richTextElement;

	beforeEach( () => {
		richTextElement = document.createElement( 'span' );
		richTextElement.setAttribute( 'contenteditable', 'true' );
		richTextElement.textContent = 'Hello world';
		document.body.appendChild( richTextElement );
	} );

	afterEach( () => {
		richTextElement.remove();
		delete document.caretPositionFromPoint;
		delete document.caretRangeFromPoint;
	} );

	it( 'focuses the element and applies the resolved caret position, preferring caretPositionFromPoint', () => {
		const textNode = richTextElement.firstChild;

		document.caretPositionFromPoint = jest.fn().mockReturnValue( {
			offsetNode: textNode,
			offset: 5,
		} );
		document.caretRangeFromPoint = jest.fn();

		const result = focusRichTextAtPoint( richTextElement, 10, 20 );

		expect( result ).toBe( true );
		expect( document.caretPositionFromPoint ).toHaveBeenCalledWith(
			10,
			20
		);
		expect( document.caretRangeFromPoint ).not.toHaveBeenCalled();
		expect( richTextElement ).toHaveFocus();

		const selection = window.getSelection();
		expect( selection.rangeCount ).toBe( 1 );
		expect( selection.getRangeAt( 0 ).startContainer ).toBe( textNode );
		expect( selection.getRangeAt( 0 ).startOffset ).toBe( 5 );
		expect( selection.getRangeAt( 0 ).collapsed ).toBe( true );
	} );

	it( 'falls back to caretRangeFromPoint when caretPositionFromPoint is unavailable', () => {
		const textNode = richTextElement.firstChild;
		const range = document.createRange();
		range.setStart( textNode, 3 );
		range.collapse( true );

		document.caretRangeFromPoint = jest.fn().mockReturnValue( range );

		const result = focusRichTextAtPoint( richTextElement, 10, 20 );

		expect( result ).toBe( true );
		expect( document.caretRangeFromPoint ).toHaveBeenCalledWith( 10, 20 );
		expect( richTextElement ).toHaveFocus();

		const selection = window.getSelection();
		expect( selection.getRangeAt( 0 ).startContainer ).toBe( textNode );
		expect( selection.getRangeAt( 0 ).startOffset ).toBe( 3 );
	} );

	it( 'returns false and leaves focus untouched when no caret position can be resolved', () => {
		document.caretPositionFromPoint = jest.fn().mockReturnValue( null );
		document.caretRangeFromPoint = jest.fn().mockReturnValue( null );

		const result = focusRichTextAtPoint( richTextElement, 10, 20 );

		expect( result ).toBe( false );
		expect( richTextElement ).not.toHaveFocus();
	} );
} );
