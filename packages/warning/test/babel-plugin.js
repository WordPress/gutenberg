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

function compare( input, output, options = {} ) {
	const { code } = transform( input, {
		configFile: false,
		plugins: [ [ babelPlugin, options ] ],
	} );
	expect( code ).toEqual( output );
}

describe( 'babel-plugin', function() {
	it( 'should replace warning calls with import declaration', () => {
		compare(
			join(
				'import warning from "@wordpress/warning";',
				'warning("a");'
			),
			join(
				'import warning from "@wordpress/warning";',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("a") : void 0;'
			)
		);
	} );

	it( 'should not replace warning calls without import declaration', () => {
		compare( 'warning("a");', 'warning("a");' );
	} );

	it( 'should replace warning calls without import declaration with plugin options', () => {
		compare(
			'warning("a");',
			'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("a") : void 0;',
			{ callee: 'warning' }
		);
	} );

	it( 'should replace multiple warning calls', () => {
		compare(
			join(
				'import warning from "@wordpress/warning";',
				'warning("a");',
				'warning("b");',
				'warning("c");'
			),
			join(
				'import warning from "@wordpress/warning";',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("a") : void 0;',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("b") : void 0;',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning("c") : void 0;'
			)
		);
	} );

	it( 'should identify warning callee name', () => {
		compare(
			join(
				'import warn from "@wordpress/warning";',
				'warn("a");',
				'warn("b");',
				'warn("c");'
			),
			join(
				'import warn from "@wordpress/warning";',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("a") : void 0;',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("b") : void 0;',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("c") : void 0;'
			)
		);
	} );

	it( 'should identify warning callee name by ', () => {
		compare(
			join(
				'import warn from "@wordpress/warning";',
				'warn("a");',
				'warn("b");',
				'warn("c");'
			),
			join(
				'import warn from "@wordpress/warning";',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("a") : void 0;',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("b") : void 0;',
				'typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warn("c") : void 0;'
			)
		);
	} );
} );
