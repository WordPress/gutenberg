/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import createUnwrapper from '../create-unwrapper';
import { deepFilter, isSpan, isInline, isEmpty } from '../utils';

const spanUnwrapper = createUnwrapper( ( node ) => isSpan( node ) );
const inlineUnwrapper = createUnwrapper( ( node ) => isInline( node ) );

describe( 'deepFilter', () => {
	it( 'should not error', () => {
		equal( deepFilter( '<span><em>test</em></span>', [ spanUnwrapper, inlineUnwrapper ] ), 'test' );
		equal( deepFilter( '<em><span>test</span></em>', [ spanUnwrapper, inlineUnwrapper ] ), 'test' );
	} );
} );

describe( 'isEmpty', () => {
	function isEmptyHTML( HTML ) {
		const doc = document.implementation.createHTMLDocument( '' );

		doc.body.innerHTML = HTML;

		return isEmpty( doc.body );
	}

	it( 'should return true for empty element', () => {
		equal( isEmptyHTML( '' ), true );
	} );

	it( 'should return true for element with only whitespace', () => {
		equal( isEmptyHTML( ' ' ), true );
	} );

	it( 'should return true for element with non breaking space', () => {
		equal( isEmptyHTML( '&nbsp;' ), true );
	} );

	it( 'should return true for element with BR', () => {
		equal( isEmptyHTML( '<br>' ), true );
	} );

	it( 'should return true for element with empty element', () => {
		equal( isEmptyHTML( '<em></em>' ), true );
	} );

	it( 'should return false for element with image', () => {
		equal( isEmptyHTML( '<img src="">' ), false );
	} );

	it( 'should return true for element with mixed empty pieces', () => {
		equal( isEmptyHTML( ' <br><br><em>&nbsp; </em>' ), true );
	} );
} );
