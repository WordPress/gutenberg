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
	getSortedCategories,
	setCategoryOrder,
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
	describe( 'setCategoryOrder()', () => {
		it( 'should reject slug not defined', () => {
			const categories = setCategoryOrder();
			expect( console.error ).toHaveBeenCalledWith( 'The slug must be defined' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject empty slug', () => {
			const categories = setCategoryOrder( '', 2 );
			expect( console.error ).toHaveBeenCalledWith( 'The slug must be defined' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject slug if it is not a string', () => {
			const categories = setCategoryOrder( 2, 2 );
			expect( console.error ).toHaveBeenCalledWith( 'The slug must be a string' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject order if it is not an integer', () => {
			const categories = setCategoryOrder( 'custom-blocks', 2.5 );
			expect( console.error ).toHaveBeenCalledWith( 'The order must be an integer' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should reject order if it is a string', () => {
			const categories = setCategoryOrder( 'custom-blocks', '2' );
			expect( console.error ).toHaveBeenCalledWith( 'The order must be an integer' );
			expect( categories ).toBeUndefined();
		} );

		it( 'should set the category order and return an array', () => {
			const categories = setCategoryOrder( 'custom-blocks', 1 );
			expect( categories ).toEqual( jasmine.arrayContaining( [ { slug: 'custom-blocks', title: 'Custom Blocks', order: 1 } ] ) );
		} );
	} );
	describe( 'getSortedCategories()', () => {
		it( 'should reject empty sortProperty', () => {
			const categories = getSortedCategories();
			expect( console.error ).toHaveBeenCalledWith( 'The sortProperty must be defined' );
			expect( categories ).toBeUndefined();
		} );
		it( 'should reject sortProperty if it is not a valid string', () => {
			const categories = getSortedCategories( 12345 );
			expect( console.error ).toHaveBeenCalledWith( 'The sortProperty must be a string' );
			expect( categories ).toBeUndefined();
		} );
		it( 'should return the first element for the array', () => {
			const categories = getSortedCategories( 'order' );
			expect( categories[ 0 ] ).toEqual( { slug: 'custom-blocks', title: 'Custom Blocks', order: 1 } );
		} );
	} );
} );
