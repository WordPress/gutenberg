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
		introText.setAttribute( 'hidden', 'hidden' );
		document.body.appendChild( introText );
	} );

	afterAll( () => {
		containerPolite.remove();
		introText.remove();
	} );

	beforeEach( () => {
		containerPolite.textContent = '';
		introText.setAttribute( 'hidden', 'hidden' );
		resetQueue();
		jest.clearAllTimers();
	} );

	it( 'should leave the container empty before the clear-fill delay elapses', () => {
		enqueuePolite( 'Hello' );

		expect( containerPolite ).toBeEmptyDOMElement();
		expect( introText ).toHaveAttribute( 'hidden' );
	} );

	it( 'should fill the container after the clear-fill delay', () => {
		enqueuePolite( 'Hello' );

		jest.advanceTimersByTime( 100 );

		expect( containerPolite ).toHaveTextContent( 'Hello' );
		expect( introText ).not.toHaveAttribute( 'hidden' );
	} );

	it( 'should announce rapid messages in FIFO order', () => {
		enqueuePolite( 'First' );
		enqueuePolite( 'Second' );
		enqueuePolite( 'Third' );

		jest.advanceTimersByTime( 100 );
		expect( containerPolite ).toHaveTextContent( 'First' );

		jest.advanceTimersByTime( 600 );
		expect( containerPolite ).toHaveTextContent( 'Second' );

		jest.advanceTimersByTime( 600 );
		expect( containerPolite ).toHaveTextContent( 'Third' );
	} );

	it( 'should clear the polite container between queued messages', () => {
		enqueuePolite( 'First' );
		enqueuePolite( 'Second' );

		jest.advanceTimersByTime( 100 );
		expect( containerPolite ).toHaveTextContent( 'First' );

		jest.advanceTimersByTime( 500 );
		expect( containerPolite ).toBeEmptyDOMElement();

		jest.advanceTimersByTime( 100 );
		expect( containerPolite ).toHaveTextContent( 'Second' );
	} );

	it( 'should not start a second drain while a message is pending', () => {
		enqueuePolite( 'First' );
		jest.advanceTimersByTime( 50 );

		enqueuePolite( 'Second' );
		jest.advanceTimersByTime( 50 );

		expect( containerPolite ).toHaveTextContent( 'First' );

		jest.advanceTimersByTime( 600 );

		expect( containerPolite ).toHaveTextContent( 'Second' );
	} );

	it( 'should restart draining after the queue is exhausted', () => {
		enqueuePolite( 'First batch' );

		jest.advanceTimersByTime( 700 );
		enqueuePolite( 'Second batch' );
		jest.advanceTimersByTime( 100 );

		expect( containerPolite ).toHaveTextContent( 'Second batch' );
	} );

	it( 'should allow a fresh drain to start after reset', () => {
		enqueuePolite( 'Before reset' );
		jest.advanceTimersByTime( 50 );
		resetQueue();
		jest.clearAllTimers();

		enqueuePolite( 'After reset' );
		jest.advanceTimersByTime( 100 );

		expect( containerPolite ).toHaveTextContent( 'After reset' );
	} );
} );
