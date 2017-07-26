import domReady from '../';

let callback = jest.fn( () => {} );

describe( 'domReady', () => {
  describe( 'when document readystate is complete', () => {
    it( 'should call the callback.', () => {
      domReady( callback );
      expect( callback ).toHaveBeenCalled();
    } );
  } );
} );
