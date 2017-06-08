/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import accept from '../';

describe( '#accept()', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'should render a dialog to the document body', () => {
		const message = 'Are you sure?';

		accept( message, () => {} );

		const dialog = document.querySelector( '.utils-accept__dialog-content' );
		expect( dialog ).to.be.an.instanceof( window.Element );
		expect( dialog.textContent ).to.equal( message );
	} );

	it( 'should trigger the callback with an accepted prompt', ( done ) => {
		accept( 'Are you sure?', ( accepted ) => {
			expect( accepted ).to.be.be.true();
			done();
		} );

		document.querySelector( '.components-button.button-primary' ).click();
	} );

	it( 'should trigger the callback with a denied prompt', ( done ) => {
		accept( 'Are you sure?', ( accepted ) => {
			expect( accepted ).to.be.be.false();
			done();
		} );

		document.querySelector( '.components-button:not( .button-primary )' ).click();
	} );

	it( 'should clean up after itself once the prompt is closed', ( done ) => {
		accept( 'Are you sure?', () => {
			process.nextTick( () => {
				expect( document.querySelector( '.utils-accept__dialog' ) ).to.be.null();

				done();
			} );
		} );

		document.querySelector( '.components-button.button-primary' ).click();
	} );
} );
