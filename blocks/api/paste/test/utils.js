/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import createUnwrapper from '../create-unwrapper';
import { deepFilterHTML, isEmpty, isInvalidInline, isPlain } from '../utils';

const spanUnwrapper = createUnwrapper( ( node ) => node.nodeName === 'SPAN' );
const inlineUnwrapper = createUnwrapper( ( node ) => node.nodeName === 'EM' );

describe( 'deepFilterHTML', () => {
	it( 'should not error', () => {
		equal( deepFilterHTML( '<span><em>test</em></span>', [ spanUnwrapper, inlineUnwrapper ] ), 'test' );
		equal( deepFilterHTML( '<em><span>test</span></em>', [ spanUnwrapper, inlineUnwrapper ] ), 'test' );
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

describe( 'isInvalidInline', () => {
	function isInvalidInlineHTML( HTML ) {
		const doc = document.implementation.createHTMLDocument( '' );

		doc.body.innerHTML = HTML;

		return isInvalidInline( doc.body.firstChild );
	}

	it( 'should return true for div element', () => {
		equal( isInvalidInlineHTML( '<em><div>test</div></em>' ), true );
	} );

	it( 'should return true for deep div element', () => {
		equal( isInvalidInlineHTML( '<em><strong><div>test</div><strong></em>' ), true );
	} );

	it( 'should return false for valid structure', () => {
		equal( isInvalidInlineHTML( '<em>test</em>' ), false );
	} );
} );

describe( 'isPlain', () => {
	it( 'should return true for plain text', () => {
		equal( isPlain( 'test' ), true );
	} );

	it( 'should return true for only line breaks', () => {
		equal( isPlain( 'test<br>test' ), true );
	} );

	it( 'should return false for formatted text', () => {
		equal( isPlain( '<strong>test</strong>' ), false );
	} );
} );
