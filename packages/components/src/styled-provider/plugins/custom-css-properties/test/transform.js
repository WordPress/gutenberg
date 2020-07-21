/**
 * Internal dependencies
 */
import { getFallbackDeclaration } from '../transform';

/*
 * This function is used within the stylisPluginCssCustomProperties plugin.
 * The incoming values are provided by the (internal) stylis CSS compiler.
 * These values have a specific format. Notably, most spaces are removed
 * the ending semicolon (;) is omitted.
 */
describe( 'getFallbackDeclaration', () => {
	beforeEach( () => {
		// Clear root HTML node styles
		document.documentElement.style = null;
	} );
	describe( 'invalid', () => {
		it( 'should return undefined if it does not contain var()', () => {
			const dec = 'font-size:14px';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( undefined );
		} );

		it( 'should return undefined fallback value is non are provided', () => {
			const dec = 'font-size: var( --fontSize )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( undefined );
		} );
	} );

	describe( 'basic', () => {
		it( 'should use fallback value if provided', () => {
			const dec = 'font-size: var( --fontSize, 14px )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:14px' );
		} );

		it( 'should use fallback value with spaces in-between var()', () => {
			const dec = 'font-size: var(   --fontSize, 14px          )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:14px' );
		} );

		it( 'should use fallback value without spaces in-between var()', () => {
			const dec = 'font-size: var(--fontSize,14px)';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:14px' );
		} );

		it( 'should use fallback with parentheses value', () => {
			const dec = 'filter: var(--blur, blur(10px))';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'filter:blur(10px)' );
		} );

		it( 'should use fallback with nested parentheses value', () => {
			const dec =
				'transform:translate3d(var(--x,5px),var(--y,10px),var( --z, 0))';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'transform:translate3d(5px,10px,0)' );
		} );
	} );

	describe( 'nested', () => {
		it( 'should use nested fallback value if provided', () => {
			const dec = 'font-size: var( --fontSize, var( --big, 20px ) )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:20px' );
		} );

		it( 'should use heavily nested fallback value if provided', () => {
			const dec =
				'font-size: var( --fontSize, var( --one, var( --two, var( --three, var( --four, 20px )))))';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:20px' );
		} );

		it( 'should use heavily nested fallback with space in-between closing parentheses', () => {
			const dec =
				'font-size: var( --fontSize, var( --one, var( --two, var( --three, var( --four, 20px ))  ) ) )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:20px' );
		} );

		it( 'should use heavily nested fallback with parentheses value', () => {
			const dec =
				'filter: var( --fontSize, var( --one, var( --two, var( --three, var( --four, blur(20px) ))  ) ) )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'filter:blur(20px)' );
		} );
	} );

	describe( ':root fallback', () => {
		it( 'should not use root fallback if one is provided', () => {
			document.documentElement.style.setProperty( '--big', '80px' );

			const dec = 'font-size: var( --fontSize, 20px )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:20px' );
		} );

		it( 'should use root fallback if none are provided', () => {
			document.documentElement.style.setProperty( '--fontSize', '80px' );

			const dec = 'font-size: var( --fontSize )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:80px' );
		} );

		it( 'should use root fallback with nested var()', () => {
			document.documentElement.style.setProperty( '--big', '80px' );

			const dec = 'font-size: var( --fontSize, var( --big ) )';
			const result = getFallbackDeclaration( dec );

			expect( result ).toEqual( 'font-size:80px' );
		} );

		it( 'should use latest root variable', () => {
			document.documentElement.style.setProperty( '--big', '80px' );

			let dec = 'font-size: var( --fontSize, var( --big ) )';
			let result = getFallbackDeclaration( dec );

			// First pass
			expect( result ).toEqual( 'font-size:80px' );

			// Update CSS variable on :root
			document.documentElement.style.setProperty( '--big', '20px' );

			dec = 'font-size: var( --fontSize, var( --big ) )';
			result = getFallbackDeclaration( dec );

			// Second pass
			expect( result ).toEqual( 'font-size:20px' );
		} );
	} );
} );
