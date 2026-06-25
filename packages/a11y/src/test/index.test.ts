/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { setup, speak } from '../';
import filterMessage from '../shared/filter-message';

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
		jest.clearAllTimers();
	} );

	describe( 'on import', () => {
		it( 'should call domReady', () => {
			expect( domReady ).toHaveBeenCalled();
		} );
	} );

	describe( 'in default (polite) mode', () => {
		it( 'should not fill the live region before the delay elapses', () => {
			speak( 'default message' );
			expect( containerPolite ).toBeEmptyDOMElement();
			expect( containerAssertive ).toBeEmptyDOMElement();
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
		it( 'should not fill the live region before the delay elapses', () => {
			speak( 'assertive message', 'assertive' );
			expect( containerAssertive ).toBeEmptyDOMElement();
		} );

		it( 'should set the textcontent of the assertive aria-live region after the delay', () => {
			speak( 'assertive message', 'assertive' );
			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toBeEmptyDOMElement();
			expect( containerAssertive ).toHaveTextContent( 'assertive message' );
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
			speak( 'first' );
			speak( 'second' );
			speak( 'third' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'first' );

			// After reading window (1500ms) + clear + fill delay (100ms).
			jest.advanceTimersByTime( 1600 );
			expect( containerPolite ).toHaveTextContent( 'second' );

			jest.advanceTimersByTime( 1600 );
			expect( containerPolite ).toHaveTextContent( 'third' );
		} );

		it( 'should clear the polite container between queued messages', () => {
			speak( 'first' );
			speak( 'second' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'first' );

			// Reading window expires; container is cleared before next fill.
			jest.advanceTimersByTime( 1500 );
			expect( containerPolite ).toBeEmptyDOMElement();

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'second' );
		} );
	} );

	describe( 'assertive and polite channel independence', () => {
		it( 'should not disturb the polite queue when assertive fires mid-drain', () => {
			speak( 'polite first' );
			speak( 'polite second' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'polite first' );

			speak( 'assertive message', 'assertive' );
			jest.advanceTimersByTime( 100 );
			expect( containerAssertive ).toHaveTextContent( 'assertive message' );
			// Polite container is untouched by the assertive path.
			expect( containerPolite ).toHaveTextContent( 'polite first' );

			// Polite queue continues draining normally.
			jest.advanceTimersByTime( 1400 );
			expect( containerPolite ).toBeEmptyDOMElement();
			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'polite second' );
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

		it( 'should set the textcontent of the polite aria-live region after the delay', () => {
			speak( 'message', 'assertive' );
			jest.advanceTimersByTime( 100 );
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

		it( 'should not throw when containers are absent', () => {
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
