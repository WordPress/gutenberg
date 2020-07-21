/**
 * Internal dependencies
 */
import stylisPluginCssCustomProperties from '../index';

describe( 'stylisPluginCssCustomProperties', () => {
	beforeEach( () => {
		// Clear root HTML node styles
		document.documentElement.style = null;
	} );

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

	const createPlugin = () =>
		stylisPluginCssCustomProperties( { skipSupportedBrowsers: false } );

	it( 'should return undefined if no fallbacks are available', () => {
		const plugin = createPlugin();
		const args = { ...baseArgs };
		args.content = 'font-size: 14px';

		const result = plugin( ...Object.values( args ) );

		expect( result ).toBe( undefined );
	} );

	it( 'should return fallback declaration and variablized declaration if var() is used and fallbacks are available', () => {
		const plugin = createPlugin();
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

	it( 'should handle declarations with parentheses values', () => {
		const plugin = createPlugin();
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

	it( 'should return fallback declarations for every var() call', () => {
		// Set :root variables
		document.documentElement.style.setProperty( '--bg', 'black' );
		document.documentElement.style.setProperty( '--size', '2' );

		const plugin = createPlugin();
		const args = { ...baseArgs };

		const input = [
			'background: var( --bg );',
			'font-size: var( --font, 14px );',
			'transform: translate( var(--x, 0) , 0) scale( var(--size, 1) );',
			'z-index: var( --z, var( --z2, 2) );',
		];

		args.content = input.join( '' );

		const result = plugin( ...Object.values( args ) );

		const compiled = [
			'background:black;',
			'background: var( --bg );',
			'font-size:14px;',
			'font-size: var( --font, 14px );',
			'transform:translate(0,0)scale(2);',
			'transform: translate( var(--x, 0) , 0) scale( var(--size, 1) );',
			'z-index:2;',
			'z-index: var( --z, var( --z2, 2) );',
		];

		expect( result ).toBe( compiled.join( '' ) );
	} );

	it( 'should return if a single fallback was transformed out of many', () => {
		const plugin = createPlugin();
		const args = { ...baseArgs };

		const input = [
			'background: var( --bg );',
			'font-size: var( --font, 14px );',
			'z-index: var( --z );',
		];

		args.content = input.join( '' );

		const result = plugin( ...Object.values( args ) );

		const compiled = [
			'background: var( --bg );',
			'font-size:14px;',
			'font-size: var( --font, 14px );',
			'z-index: var( --z );',
		];

		expect( result ).toBe( compiled.join( '' ) );
	} );
} );
