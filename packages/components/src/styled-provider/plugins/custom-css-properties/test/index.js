/**
 * Internal dependencies
 */
import stylisPluginCssCustomProperties from '../index';
import { getFallbackDeclaration } from '../utils';

describe( 'stylisPluginCssCustomProperties', () => {
	beforeEach( () => {
		// Clear root HTML node styles
		document.documentElement.style = null;
	} );
	/*
	 * This function is used within the stylisPluginCssCustomProperties plugin.
	 * The incoming values are provided by the (internal) stylis CSS compiler.
	 * These values have a specific format. Notably, most spaces are removed
	 * the ending semicolon (;) is omitted.
	 */
	describe( 'getFallbackDeclaration', () => {
		describe( 'invalid', () => {
			test( 'should return undefined if it does not contain var()', () => {
				const dec = 'font-size:14px';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( undefined );
			} );

			test( 'should return undefined fallback value is non are provided', () => {
				const dec = 'font-size: var( --fontSize )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( undefined );
			} );
		} );

		describe( 'basic', () => {
			test( 'should use fallback value if provided', () => {
				const dec = 'font-size: var( --fontSize, 14px )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:14px' );
			} );

			test( 'should use fallback value with spaces in-between var()', () => {
				const dec = 'font-size: var(   --fontSize, 14px          )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:14px' );
			} );

			test( 'should use fallback value without spaces in-between var()', () => {
				const dec = 'font-size: var(--fontSize,14px)';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:14px' );
			} );

			test( 'should use fallback with parentheses value', () => {
				const dec = 'filter: var(--blur, blur(10px))';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'filter:blur(10px)' );
			} );

			test( 'should use fallback with nested parentheses value', () => {
				const dec =
					'transform:translate3d(var(--x,5px),var(--y,10px),var( --z, 0))';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'transform:translate3d(5px,10px,0)' );
			} );
		} );

		describe( 'nested', () => {
			test( 'should use nested fallback value if provided', () => {
				const dec = 'font-size: var( --fontSize, var( --big, 20px ) )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:20px' );
			} );

			test( 'should use heavily nested fallback value if provided', () => {
				const dec =
					'font-size: var( --fontSize, var( --one, var( --two, var( --three, var( --four, 20px )))))';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:20px' );
			} );

			test( 'should use heavily nested fallback with space in-between closing parentheses', () => {
				const dec =
					'font-size: var( --fontSize, var( --one, var( --two, var( --three, var( --four, 20px ))  ) ) )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:20px' );
			} );

			test( 'should use heavily nested fallback with parentheses value', () => {
				const dec =
					'filter: var( --fontSize, var( --one, var( --two, var( --three, var( --four, blur(20px) ))  ) ) )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'filter:blur(20px)' );
			} );
		} );

		describe( ':root fallback', () => {
			test( 'should not use root fallback if one is provided', () => {
				document.documentElement.style.setProperty( '--big', '80px' );

				const dec = 'font-size: var( --fontSize, 20px )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:20px' );
			} );

			test( 'should use root fallback if none are provided', () => {
				document.documentElement.style.setProperty(
					'--fontSize',
					'80px'
				);

				const dec = 'font-size: var( --fontSize )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:80px' );
			} );

			test( 'should use root fallback with nested var()', () => {
				document.documentElement.style.setProperty( '--big', '80px' );

				const dec = 'font-size: var( --fontSize, var( --big ) )';
				const result = getFallbackDeclaration( dec );

				expect( result ).toEqual( 'font-size:80px' );
			} );

			test( 'should use latest root variable', () => {
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

	describe( 'stylisPluginCssCustomProperties', () => {
		const baseArgs = {
			context: 2,
			content: '',
			selectors: [ '.font' ],
			parents: [],
			line: 80,
			column: 2,
			length: 10,
			type: 105,
		};

		test( 'should return undefined if no fallbacks are available', () => {
			const plugin = stylisPluginCssCustomProperties();
			const args = { ...baseArgs };
			args.content = 'font-size: 14px';

			const result = plugin( ...Object.values( args ) );

			expect( result ).toBe( undefined );
		} );

		test( 'should return fallback declaration and variablized declaration if var() is used and fallbacks are available', () => {
			const plugin = stylisPluginCssCustomProperties();
			const args = { ...baseArgs };

			const input = [ 'font-size: var( --font, 14px );' ];

			args.content = input.join( '' );

			const result = plugin( ...Object.values( args ) );

			const compiled = [
				'font-size:14px;',
				'font-size: var( --font, 14px );',
			];

			expect( result ).toBe( compiled.join( '' ) );
		} );

		test( 'should handle declarations with parentheses values', () => {
			const plugin = stylisPluginCssCustomProperties();
			const args = { ...baseArgs };

			const input = [
				'font-size: var( --font, 14px );',
				'filter: var( --blur, blur(20px) );',
				'transform: translate3d(0, 0, 0);',
			];

			args.content = input.join( '' );

			const result = plugin( ...Object.values( args ) );

			const compiled = [
				'font-size:14px;',
				'font-size: var( --font, 14px );',
				'filter:blur(20px);',
				'filter: var( --blur, blur(20px) );',
				'transform: translate3d(0, 0, 0);',
			];

			expect( result ).toBe( compiled.join( '' ) );
		} );

		test( 'should return fallback declarations for every var() call', () => {
			// Set :root variables
			document.documentElement.style.setProperty( '--bg', 'black' );

			const plugin = stylisPluginCssCustomProperties();
			const args = { ...baseArgs };

			const input = [
				'background: var( --bg );',
				'font-size: var( --font, 14px );',
				'z-index: var( --z, var( --z2, 2) );',
			];

			args.content = input.join( '' );

			const result = plugin( ...Object.values( args ) );

			const compiled = [
				'background:black;',
				'background: var( --bg );',
				'font-size:14px;',
				'font-size: var( --font, 14px );',
				'z-index:2;',
				'z-index: var( --z, var( --z2, 2) );',
			];

			expect( result ).toBe( compiled.join( '' ) );
		} );
	} );
} );
