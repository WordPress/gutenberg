/* eslint-disable no-console */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	registerCategory,
} from '../categories';

describe( 'categories', () => {
	const error = console.error;

	// Reset block state before each test.
	beforeEach( () => {
		console.error = jest.fn();
	} );

	afterEach( () => {
		console.error = error;
	} );

	describe( 'registerCategory()', () => {
		it( 'should reject empty categories', () => {
			const categories = registerCategory();
			expect( console.error ).toHaveBeenCalledWith( 'The block Category must be defined' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject categories with empty slug', () => {
			const categories = registerCategory( { slug: '', title: __( 'Custom Blocks' ) } );
			expect( console.error ).toHaveBeenCalledWith( 'The block Category slug must be defined' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject categories with slug not defined', () => {
			const categories = registerCategory( { title: __( 'Custom Blocks' ) } );
			expect( console.error ).toHaveBeenCalledWith( 'The block Category slug must be defined' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject categories with invalid slug', () => {
			const categories = registerCategory( { slug: 'custom blocks', title: __( 'Custom Blocks' ) } );
			expect( console.error ).toHaveBeenCalledWith( 'The block Category slug must not contain characters which are invalid for urls' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject categories with empty title', () => {
			const categories = registerCategory( { slug: 'custom-blocks', title: '' } );
			expect( console.error ).toHaveBeenCalledWith( 'The block Category title must be defined' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should store the new category', () => {
			const categories = registerCategory( { slug: 'custom-blocks', title: 'Custom Blocks' } );
			expect( categories ).toEqual( jasmine.arrayContaining( [ { slug: 'custom-blocks', title: 'Custom Blocks' } ] ) );
		} );

		it( 'should reject categories already registered', () => {
			const categories = registerCategory( { slug: 'custom-blocks', title: 'Custom Blocks' } );
			expect( console.error ).toHaveBeenCalledWith( 'The block Category "custom-blocks" is already registered' );
			expect( categories ).toBeUndefined();
		} );
	} );
} );
