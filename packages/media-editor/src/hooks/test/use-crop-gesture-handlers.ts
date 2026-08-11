import { isTextEntryField } from '../use-crop-gesture-handlers';

function makeInput( type?: string ): HTMLElement {
	const input = document.createElement( 'input' );
	if ( type ) {
		input.setAttribute( 'type', type );
	}
	return input;
}

describe( 'isTextEntryField', () => {
	it( 'claims the shortcut for a text field', () => {
		expect( isTextEntryField( makeInput( 'text' ) ) ).toBe( true );
	} );

	it( 'claims the shortcut for the scale fields', () => {
		expect( isTextEntryField( makeInput( 'number' ) ) ).toBe( true );
	} );

	it( 'claims the shortcut for an input with no type, which defaults to text', () => {
		expect( isTextEntryField( makeInput() ) ).toBe( true );
	} );

	it( 'claims the shortcut for a textarea', () => {
		expect( isTextEntryField( document.createElement( 'textarea' ) ) ).toBe(
			true
		);
	} );

	it( 'claims the shortcut for contenteditable content', () => {
		const editable = document.createElement( 'div' );
		// jsdom does not implement isContentEditable from the attribute.
		Object.defineProperty( editable, 'isContentEditable', {
			value: true,
		} );

		expect( isTextEntryField( editable ) ).toBe( true );
	} );

	it( 'leaves the shortcut to the image editor for the rotation slider', () => {
		expect( isTextEntryField( makeInput( 'range' ) ) ).toBe( false );
	} );

	it( 'leaves the shortcut to the image editor for a checkbox', () => {
		expect( isTextEntryField( makeInput( 'checkbox' ) ) ).toBe( false );
	} );

	it( 'leaves the shortcut to the image editor for the aspect ratio select', () => {
		expect( isTextEntryField( document.createElement( 'select' ) ) ).toBe(
			false
		);
	} );

	it( 'leaves the shortcut to the image editor for a button', () => {
		expect( isTextEntryField( document.createElement( 'button' ) ) ).toBe(
			false
		);
	} );
} );
