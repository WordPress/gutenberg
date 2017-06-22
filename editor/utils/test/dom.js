/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { isEditableElement } from '../dom';

describe( 'isEditableElement', () => {
	it( 'should return false for non editable nodes', () => {
		const div = document.createElement( 'div' );

		expect( isEditableElement( div ) ).to.be.false();
	} );

	it( 'should return true for inputs', () => {
		const input = document.createElement( 'input' );

		expect( isEditableElement( input ) ).to.be.true();
	} );

	it( 'should return true for textareas', () => {
		const textarea = document.createElement( 'textarea' );

		expect( isEditableElement( textarea ) ).to.be.true();
	} );

	it( 'should return true for selects', () => {
		const select = document.createElement( 'select' );

		expect( isEditableElement( select ) ).to.be.true();
	} );
} );
