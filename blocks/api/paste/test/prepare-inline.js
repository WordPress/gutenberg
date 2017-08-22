/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import prepareInline from '../prepare-inline';

describe( 'stripWrappers', () => {
	it( 'should remove non inline tags', () => {
		equal( prepareInline( '<p>test</p>' ), 'test' );
	} );

	it( 'should deep remove non inline tags', () => {
		equal( prepareInline( '<div><p>test</p></div>' ), 'test' );
	} );

	it( 'should remove images', () => {
		equal( prepareInline( 'test <img src="" />' ), 'test ' );
	} );

	it( 'should keep inline tags', () => {
		equal( prepareInline( '<em>test</em>' ), '<em>test</em>' );
	} );
} );
