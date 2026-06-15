/**
 * Internal dependencies
 */
import domReady from '../';

describe( 'domReady', () => {
	describe( 'when document readystate is complete', () => {
		it( 'should call the callback.', () => {
			const callback = jest.fn( () => {} );
			Object.defineProperty( document, 'readyState', {
				get: () => 'complete',
				configurable: true,
			} );
			domReady( callback );
			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'when document readystate is interactive', () => {
		it( 'should call the callback.', () => {
			const callback = jest.fn( () => {} );
			Object.defineProperty( document, 'readyState', {
				get: () => 'interactive',
				configurable: true,
			} );
			domReady( callback );
			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'when document readystate is still loading', () => {
		it( 'should add the callback as an event listener to the DOMContentLoaded event.', () => {
			const addEventListener = jest.fn( () => {} );
			Object.defineProperty( document, 'readyState', {
				get: () => 'loading',
				configurable: true,
			} );
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
