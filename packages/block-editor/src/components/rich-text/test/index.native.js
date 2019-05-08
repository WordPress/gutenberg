/**
 * Internal dependencies
 */
import { RichText } from '../index.native';

describe( 'RichText Native', () => {
  let richText;

  beforeEach( () => {
    richText = new RichText( { multiline: false } );
  } );

  it ( 'exists', () => {
    expect( richText );
  } );

	describe( 'willTrimSpaces', () => {
		it( 'exists', () => {
      expect( richText.willTrimSpaces );
		} );

		it( 'is a function', () => {
      expect( typeof richText.willTrimSpaces === 'function' );
		} );

    it( 'reports false for styled text with no outer spaces', () => {
      let html = '<p><b>Hello</b> <strong>Hello</strong> WorldWorld!</p>';
      expect( richText.willTrimSpaces( html ) ).toBe( false );
    } );
	} );
} );
