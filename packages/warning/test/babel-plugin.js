/**
 * External dependencies
 */
import { transform } from '@babel/core';

/**
 * Internal dependencies
 */
import babelPlugin from '../babel-plugin';

function join( ...strings ) {
	return strings.join( '\n' );
}

function transformCode( input, options = {} ) {
	const { code } = transform( input, {
		configFile: false,
		plugins: [ [ babelPlugin, options ] ],
	} );
	return code;
}

describe( 'babel-plugin', () => {
	it( 'should replace warning calls with import declaration', () => {
		const input = join(
			'import warning from "@wordpress/warning";',
			'warning("a");'
		);
		const expected = join(
			'import warning from "@wordpress/warning";',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("a") : void 0;'
		);

		expect( transformCode( input ) ).toEqual( expected );
	} );

	it( 'should not replace warning calls without import declaration', () => {
		const input = 'warning("a");';
		const expected = 'warning("a");';

		expect( transformCode( input ) ).toEqual( expected );
	} );

	it( 'should replace warning calls without import declaration with plugin options', () => {
		const input = 'warning("a");';
		const options = { callee: 'warning' };
		const expected =
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("a") : void 0;';

		expect( transformCode( input, options ) ).toEqual( expected );
	} );

	it( 'should replace multiple warning calls', () => {
		const input = join(
			'import warning from "@wordpress/warning";',
			'warning("a");',
			'warning("b");',
			'warning("c");'
		);
		const expected = join(
			'import warning from "@wordpress/warning";',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("a") : void 0;',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("b") : void 0;',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("c") : void 0;'
		);

		expect( transformCode( input ) ).toEqual( expected );
	} );

	it( 'should identify warning callee name', () => {
		const input = join(
			'import warn from "@wordpress/warning";',
			'warn("a");',
			'warn("b");',
			'warn("c");'
		);
		const expected = join(
			'import warn from "@wordpress/warning";',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("a") : void 0;',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("b") : void 0;',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("c") : void 0;'
		);

		expect( transformCode( input ) ).toEqual( expected );
	} );

	it( 'should identify warning callee name by', () => {
		const input = join(
			'import warn from "@wordpress/warning";',
			'warn("a");',
			'warn("b");',
			'warn("c");'
		);
		const expected = join(
			'import warn from "@wordpress/warning";',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("a") : void 0;',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("b") : void 0;',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("c") : void 0;'
		);

		expect( transformCode( input ) ).toEqual( expected );
	} );
} );
