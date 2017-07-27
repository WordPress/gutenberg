import { speak } from '../';

jest.mock( '../clear', () => {
  return jest.fn();
} );
jest.mock( '@wordpress/dom-ready', () => {
  return jest.fn( ( callback ) => { callback(); } );
} );
jest.mock( '../filterMessage', () => {
  return jest.fn( ( message ) => { return message; } );
} );

import clear from '../clear';
import domReady from '@wordpress/dom-ready';
import filterMessage from '../filterMessage';

describe( 'speak', () => {
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
      speak( 'default message' );
      expect( containerPolite.textContent ).toBe( 'default message' );
      expect( containerAssertive.textContent ).toBe( '' );
      expect( clear ).toHaveBeenCalled();
      expect( filterMessage ).toHaveBeenCalledWith( 'default message' );
    } );
  } );

  describe( 'in assertive mode', () => {
    it( 'should set the textcontent of the assertive aria-live region', () => {
      speak( 'assertive message', 'assertive' );
      expect( containerPolite.textContent ).toBe( '' );
      expect( containerAssertive.textContent ).toBe( 'assertive message' );
    } );
  } );

  describe( 'in explicit polite mode', () => {
    it( 'should set the textcontent of the polite aria-live region', () => {
      speak( 'polite message', 'polite' );
      expect( containerPolite.textContent ).toBe( 'polite message' );
      expect( containerAssertive.textContent ).toBe( '' );
    } );
  } );
} );
