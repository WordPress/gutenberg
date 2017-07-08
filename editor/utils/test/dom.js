/**
 * Internal dependencies
 */
import { isEditableElement } from '../dom';

describe( 'isEditableElement', () => {
	it( 'should return false for non editable nodes', () => {
		const div = document.createElement( 'div' );

		expect( isEditableElement( div ) ).toBe( false );
	} );

	it( 'should return true for inputs', () => {
		const input = document.createElement( 'input' );

		expect( isEditableElement( input ) ).toBe( true );
	} );

	it( 'should return true for textareas', () => {
		const textarea = document.createElement( 'textarea' );

		expect( isEditableElement( textarea ) ).toBe( true );
	} );

	it( 'should return true for selects', () => {
		const select = document.createElement( 'select' );

		expect( isEditableElement( select ) ).toBe( true );
	} );
} );
