/**
 * Internal dependencies
 */
import domReady from '../';

/**
 * In JSDOM, unlike browsers, readyState can be overwritten to simulate different document states.
 */
interface MockDocument extends Document {
	readyState: DocumentReadyState;
}

describe( 'domReady', () => {
	beforeAll( () => {
		Object.defineProperty( document, 'readyState', {
			value: 'loading',
			writable: true,
		} );
	} );

	describe( 'when document readystate is complete', () => {
		it( 'should call the callback.', () => {
			const callback = jest.fn( () => {} );
			( document as MockDocument ).readyState = 'complete';
			domReady( callback );
			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'when document readystate is interactive', () => {
		it( 'should call the callback.', () => {
			const callback = jest.fn( () => {} );
			( document as MockDocument ).readyState = 'interactive';
			domReady( callback );
			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'when document readystate is still loading', () => {
		it( 'should add the callback as an event listener to the DOMContentLoaded event.', () => {
			const addEventListener = jest.fn( () => {} );
			( document as MockDocument ).readyState = 'loading';
			Object.defineProperty( document, 'addEventListener', {
				value: addEventListener,
			} );

			const callback = jest.fn( () => {} );
			domReady( callback );
			expect( callback ).not.toHaveBeenCalled();
			expect( addEventListener ).toHaveBeenCalledWith(
				'DOMContentLoaded',
				callback
			);
		} );
	} );
} );
