/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { setup, speak } from '../';
import filterMessage from '../shared/filter-message';
import { resetQueue } from '../shared/queue';

jest.useFakeTimers();

jest.mock( '@wordpress/dom-ready', () => {
	return jest.fn( ( callback: () => void ) => {
		callback();
	} );
} );
jest.mock( '../shared/filter-message', () => {
	return jest.fn( ( message: string ) => {
		return message;
	} );
} );

describe( 'speak', () => {
	let containerPolite = document.getElementById( 'a11y-speak-polite' );
	let containerAssertive = document.getElementById( 'a11y-speak-assertive' );

	beforeEach( () => {
		containerPolite!.textContent = '';
		containerAssertive!.textContent = '';
		resetQueue();
		jest.clearAllTimers();
	} );

	describe( 'on import', () => {
		it( 'should call domReady', () => {
			expect( domReady ).toHaveBeenCalled();
		} );
	} );

	describe( 'in default (polite) mode', () => {
		it( 'should not fill the polite aria-live region before the delay elapses', () => {
			speak( 'default message' );

			expect( containerPolite ).toBeEmptyDOMElement();
			expect( containerAssertive ).toBeEmptyDOMElement();
			expect( filterMessage ).toHaveBeenCalledWith( 'default message' );
		} );

		it( 'should set the textcontent of the polite aria-live region after the delay', () => {
			speak( 'default message' );
			jest.advanceTimersByTime( 100 );

			expect( containerPolite ).toHaveTextContent( 'default message' );
			expect( containerAssertive ).toBeEmptyDOMElement();
			expect( filterMessage ).toHaveBeenCalledWith( 'default message' );
		} );
	} );

	describe( 'in assertive mode', () => {
		it( 'should immediately set the textcontent of the assertive aria-live region', () => {
			speak( 'assertive message', 'assertive' );

			expect( containerPolite ).toBeEmptyDOMElement();
			expect( containerAssertive ).toHaveTextContent(
				'assertive message'
			);
		} );
	} );

	describe( 'in explicit polite mode', () => {
		it( 'should set the textcontent of the polite aria-live region after the delay', () => {
			speak( 'polite message', 'polite' );
			jest.advanceTimersByTime( 100 );

			expect( containerPolite ).toHaveTextContent( 'polite message' );
			expect( containerAssertive ).toBeEmptyDOMElement();
		} );
	} );

	describe( 'polite queue', () => {
		it( 'should announce rapid polite messages in order without dropping any', () => {
			speak( 'First' );
			speak( 'Second' );
			speak( 'Third' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'First' );

			jest.advanceTimersByTime( 600 );
			expect( containerPolite ).toHaveTextContent( 'Second' );

			jest.advanceTimersByTime( 600 );
			expect( containerPolite ).toHaveTextContent( 'Third' );
		} );

		it( 'should clear the polite container between queued messages', () => {
			speak( 'First' );
			speak( 'Second' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'First' );

			jest.advanceTimersByTime( 500 );
			expect( containerPolite ).toBeEmptyDOMElement();

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'Second' );
		} );
	} );

	describe( 'assertive and polite channel independence', () => {
		it( 'should not disturb the polite queue when an assertive message is spoken', () => {
			speak( 'Polite first' );
			speak( 'Polite second' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'Polite first' );

			speak( 'Assertive message', 'assertive' );

			expect( containerAssertive ).toHaveTextContent(
				'Assertive message'
			);
			expect( containerPolite ).toHaveTextContent( 'Polite first' );

			jest.advanceTimersByTime( 500 );
			expect( containerPolite ).toBeEmptyDOMElement();

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'Polite second' );
		} );
	} );

	describe( 'when somehow the assertive container is not present', () => {
		beforeEach( () => {
			document.getElementById( 'a11y-speak-assertive' )?.remove();
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

	describe( 'when somehow both containers are not present', () => {
		beforeEach( () => {
			containerAssertive?.remove();
			containerPolite?.remove();
		} );

		afterEach( () => {
			setup();
			containerPolite = document.getElementById( 'a11y-speak-polite' );
			containerAssertive = document.getElementById(
				'a11y-speak-assertive'
			);
		} );

		it( 'should not throw', () => {
			expect( document.getElementById( 'a11y-speak-polite' ) ).toBeNull();
			expect(
				document.getElementById( 'a11y-speak-assertive' )
			).toBeNull();
			expect( () => {
				speak( 'message' );
				jest.advanceTimersByTime( 100 );
			} ).not.toThrow();
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
