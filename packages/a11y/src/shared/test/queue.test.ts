/**
 * Internal dependencies
 */
import { enqueuePolite, resetQueue } from '../queue';

jest.useFakeTimers();

describe( 'polite announcement queue', () => {
	let containerPolite: HTMLElement;
	let introText: HTMLElement;

	beforeAll( () => {
		containerPolite = document.createElement( 'div' );
		containerPolite.id = 'a11y-speak-polite';
		document.body.appendChild( containerPolite );

		introText = document.createElement( 'p' );
		introText.id = 'a11y-speak-intro-text';
		introText.setAttribute( 'hidden', '' );
		document.body.appendChild( introText );
	} );

	afterAll( () => {
		containerPolite.remove();
		introText.remove();
	} );

	beforeEach( () => {
		containerPolite.textContent = '';
		introText.setAttribute( 'hidden', '' );
		resetQueue();
		jest.clearAllTimers();
	} );

	describe( 'single message', () => {
		it( 'should leave the container empty before the delay fires', () => {
			enqueuePolite( 'hello' );
			expect( containerPolite ).toBeEmptyDOMElement();
		} );

		it( 'should fill the container after 100ms', () => {
			enqueuePolite( 'hello' );
			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'hello' );
		} );

		it( 'should unhide the intro text after 100ms', () => {
			enqueuePolite( 'hello' );
			jest.advanceTimersByTime( 100 );
			expect( introText ).not.toHaveAttribute( 'hidden' );
		} );
	} );

	describe( 'multiple rapid messages', () => {
		it( 'should announce all messages in FIFO order', () => {
			enqueuePolite( 'first' );
			enqueuePolite( 'second' );
			enqueuePolite( 'third' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'first' );

			jest.advanceTimersByTime( 1600 ); // 1500ms reading + 100ms fill.
			expect( containerPolite ).toHaveTextContent( 'second' );

			jest.advanceTimersByTime( 1600 );
			expect( containerPolite ).toHaveTextContent( 'third' );
		} );

		it( 'should clear the container between messages', () => {
			enqueuePolite( 'first' );
			enqueuePolite( 'second' );

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'first' );

			jest.advanceTimersByTime( 1500 );
			expect( containerPolite ).toBeEmptyDOMElement();

			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'second' );
		} );

		it( 'should not start a second drain when already draining', () => {
			enqueuePolite( 'first' );
			jest.advanceTimersByTime( 50 ); // Mid-drain for 'first'.
			enqueuePolite( 'second' );

			// 'first' fills at 100ms from start.
			jest.advanceTimersByTime( 50 );
			expect( containerPolite ).toHaveTextContent( 'first' );

			// 'second' fills after the reading window + fill delay.
			jest.advanceTimersByTime( 1600 );
			expect( containerPolite ).toHaveTextContent( 'second' );
		} );
	} );

	describe( 'queue exhaustion', () => {
		it( 'should leave the container with the last message after draining', () => {
			enqueuePolite( 'only' );
			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'only' );

			// After the reading window the queue is empty; the container is
			// not cleared until the next drain cycle begins.
			jest.advanceTimersByTime( 1500 );
			expect( containerPolite ).toHaveTextContent( 'only' );
		} );

		it( 'should accept new messages after the queue has fully drained', () => {
			enqueuePolite( 'first batch' );
			jest.advanceTimersByTime( 1700 ); // Full cycle: fill + reading.

			enqueuePolite( 'second batch' );
			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'second batch' );
		} );
	} );

	describe( 'resetQueue', () => {
		it( 'should allow a fresh drain to start after reset', () => {
			enqueuePolite( 'before reset' );
			jest.advanceTimersByTime( 50 );
			resetQueue();
			jest.clearAllTimers();

			enqueuePolite( 'after reset' );
			jest.advanceTimersByTime( 100 );
			expect( containerPolite ).toHaveTextContent( 'after reset' );
		} );
	} );
} );
