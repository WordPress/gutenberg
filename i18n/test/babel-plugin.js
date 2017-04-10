/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import babelPlugin from '../babel-plugin';

describe( 'babel-plugin', () => {
	const { isValidTranslationKey, isSameTranslation } = babelPlugin;

	describe( '.isValidTranslationKey()', () => {
		it( 'should return false if not one of valid keys', () => {
			expect( isValidTranslationKey( 'foo' ) ).to.be.false();
		} );

		it( 'should return true if one of valid keys', () => {
			expect( isValidTranslationKey( 'msgid' ) ).to.be.true();
		} );
	} );

	describe( '.isSameTranslation()', () => {
		it( 'should return false if any translation keys differ', () => {
			const a = { msgid: 'foo' };
			const b = { msgid: 'bar' };

			expect( isSameTranslation( a, b ) ).to.be.false();
		} );

		it( 'should return true if all translation keys the same', () => {
			const a = { msgid: 'foo', comments: { reference: 'a' } };
			const b = { msgid: 'foo', comments: { reference: 'b' } };

			expect( isSameTranslation( a, b ) ).to.be.true();
		} );
	} );
} );
