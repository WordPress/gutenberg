import A11ySpeak from '../';

jest.mock( "../clear", () => {
	return jest.fn();
} );
jest.mock( "../domReady", () => {
	return jest.fn( ( callback ) => { callback(); } );
} );
jest.mock( "../filterMessage", () => {
	return jest.fn( ( message ) => { return message; } );
} );

import clear from "../clear";
import domReady from "../domReady";
import filterMessage from "../filterMessage";

describe( 'A11ySpeak', () => {
	let containerPolite = document.getElementById( 'a11y-speak-polite' );
	let containerAssertive = document.getElementById( 'a11y-speak-assertive' );

	beforeEach(() => {
	  containerPolite.textContent = '';
		containerAssertive.textContent = '';
	});

	describe( 'on import', () => {
		it( 'should call domReady', () => {
			expect( domReady ).toHaveBeenCalled();
		} );
	} );

	describe( 'in default mode', () => {
		it( 'should set the textcontent of the polite aria-live region', () => {
			A11ySpeak( 'default message' );
			expect( containerPolite.textContent ).toBe( 'default message' );
			expect( containerAssertive.textContent ).toBe( '' );
			expect( clear ).toHaveBeenCalled();
			expect( filterMessage ).toHaveBeenCalledWith( 'default message' );
		} )
	} );

	describe( 'in assertive mode', () => {
		it( 'should set the textcontent of the assertive aria-live region', () => {
			A11ySpeak( 'assertive message', 'assertive' );
			expect( containerPolite.textContent ).toBe( '' );
			expect( containerAssertive.textContent ).toBe( 'assertive message' );
		} )
	} );

	describe( 'in explicit polite mode', () => {
		it( 'should set the textcontent of the polite aria-live region', () => {
			A11ySpeak( 'polite message', 'polite' );
			expect( containerPolite.textContent ).toBe( 'polite message' );
			expect( containerAssertive.textContent ).toBe( '' );
		} )
	} );
} );
