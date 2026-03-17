/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { setup, speak } from '../';
import clear from '../shared/clear';
import filterMessage from '../shared/filter-message';

jest.mock( '../shared/clear', () => {
	return jest.fn();
} );
jest.mock( '@wordpress/dom-ready', () => {
	return jest.fn( ( callback ) => {
		callback();
	} );
} );
jest.mock( '../shared/filter-message', () => {
	return jest.fn( ( message ) => {
		return message;
	} );
} );

describe( 'speak', () => {
	let containerPolite = document.getElementById( 'a11y-speak-polite' );
	let containerAssertive = document.getElementById( 'a11y-speak-assertive' );

	beforeEach( () => {
		containerPolite.textContent = '';
		containerAssertive.textContent = '';
	} );

	describe( 'on import', () => {
		it( 'should call domReady', () => {
			expect( domReady ).toHaveBeenCalled();
		} );
	} );

	describe( 'in default mode', () => {
		it( 'should set the textcontent of the polite aria-live region', () => {
			speak( 'default message' );
			expect( containerPolite ).toHaveTextContent( 'default message' );
			expect( containerAssertive ).toBeEmptyDOMElement();
			expect( clear ).toHaveBeenCalled();
			expect( filterMessage ).toHaveBeenCalledWith( 'default message' );
		} );
	} );

	describe( 'in assertive mode', () => {
		it( 'should set the textcontent of the assertive aria-live region', () => {
			speak( 'assertive message', 'assertive' );
			expect( containerPolite ).toBeEmptyDOMElement();
			expect( containerAssertive ).toHaveTextContent(
				'assertive message'
			);
		} );
	} );

	describe( 'in explicit polite mode', () => {
		it( 'should set the textcontent of the polite aria-live region', () => {
			speak( 'polite message', 'polite' );
			expect( containerPolite ).toHaveTextContent( 'polite message' );
			expect( containerAssertive ).toBeEmptyDOMElement();
		} );
	} );

	describe( 'when somehow the assertive container is not present', () => {
		beforeEach( () => {
			document.getElementById( 'a11y-speak-assertive' ).remove();
		} );

		afterEach( () => {
			setup();
			containerAssertive = document.getElementById(
				'a11y-speak-assertive'
			);
		} );

		it( 'should set the textcontent of the polite aria-live region', () => {
			speak( 'message', 'assertive' );
			expect( containerPolite ).toHaveTextContent( 'message' );
			expect(
				document.getElementById( 'a11y-speak-assertive' )
			).toBeNull();
		} );
	} );

	describe( 'when somehow the both containers are not present', () => {
		beforeEach( () => {
			containerAssertive.remove();
			containerPolite.remove();
		} );

		afterEach( () => {
			setup();
			containerPolite = document.getElementById( 'a11y-speak-polite' );
			containerAssertive = document.getElementById(
				'a11y-speak-assertive'
			);
		} );

		it( 'should set the textcontent of the polite aria-live region', () => {
			expect( document.getElementById( 'a11y-speak-polite' ) ).toBeNull();
			expect(
				document.getElementById( 'a11y-speak-assertive' )
			).toBeNull();
		} );
	} );

	describe( 'setup when the elements already exist', () => {
		it( 'should not create the aria live regions again', () => {
			const before =
				document.getElementsByClassName( 'a11y-speak-region' ).length;
			setup();
			const after =
				document.getElementsByClassName( 'a11y-speak-region' ).length;

			expect( before ).toBe( after );
		} );
	} );
} );
