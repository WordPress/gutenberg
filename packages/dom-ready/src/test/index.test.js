import domReady from '../';

describe( 'domReady', () => {
	describe( 'when document readystate is complete', () => {
		it( 'should call the callback.', () => {
			let callback = jest.fn( () => {} );

			domReady( callback );
			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'when document readystate is still loading', () => {
		it( 'should add the callback as an event listener to the DOMContentLoaded event.', () => {
			let addEventListener = jest.fn( () => {} );

			Object.defineProperty( document, 'readyState', {
				value: 'loading',
			} );
			Object.defineProperty( document, 'addEventListener', {
				value: addEventListener,
			} );

			let callback = jest.fn( () => {} );
			domReady( callback );
			expect( callback ).not.toHaveBeenCalled();
			expect( addEventListener ).toHaveBeenCalledWith( 'DOMContentLoaded', callback );
		} );
	} );
} );
