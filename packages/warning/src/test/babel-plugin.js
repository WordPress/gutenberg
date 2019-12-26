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
				'warning(true, "a", "b");'
			),
			join(
				'import warning from "@wordpress/warning";',
				'process.env.NODE_ENV !== "production" ? warning(true, "a", "b") : void 0;'
			)
		);
	} );

	it( 'should not replace warning calls without import declaration', () => {
		compare(
			'warning(true, "a", "b");',
			'warning(true, "a", "b");'
		);
	} );

	it( 'should replace warning calls without import declaration with plugin options', () => {
		compare(
			'warning(true, "a", "b");',
			'process.env.NODE_ENV !== "production" ? warning(true, "a", "b") : void 0;',
			{ callee: 'warning' }
		);
	} );

	it( 'should replace multiple warning calls', () => {
		compare(
			join(
				'import warning from "@wordpress/warning";',
				'warning(true, "a", "b");',
				'warning(false, "b", "a");',
				'warning(cond, "c");',
			),
			join(
				'import warning from "@wordpress/warning";',
				'process.env.NODE_ENV !== "production" ? warning(true, "a", "b") : void 0;',
				'process.env.NODE_ENV !== "production" ? warning(false, "b", "a") : void 0;',
				'process.env.NODE_ENV !== "production" ? warning(cond, "c") : void 0;'
			)
		);
	} );

	it( 'should identify warning callee name', () => {
		compare(
			join(
				'import warn from "@wordpress/warning";',
				'warn(true, "a", "b");',
				'warn(false, "b", "a");',
				'warn(cond, "c");',
			),
			join(
				'import warn from "@wordpress/warning";',
				'process.env.NODE_ENV !== "production" ? warn(true, "a", "b") : void 0;',
				'process.env.NODE_ENV !== "production" ? warn(false, "b", "a") : void 0;',
				'process.env.NODE_ENV !== "production" ? warn(cond, "c") : void 0;'
			)
		);
	} );

	it( 'should identify warning callee name by ', () => {
		compare(
			join(
				'import warn from "@wordpress/warning";',
				'warn(true, "a", "b");',
				'warn(false, "b", "a");',
				'warn(cond, "c");',
			),
			join(
				'import warn from "@wordpress/warning";',
				'process.env.NODE_ENV !== "production" ? warn(true, "a", "b") : void 0;',
				'process.env.NODE_ENV !== "production" ? warn(false, "b", "a") : void 0;',
				'process.env.NODE_ENV !== "production" ? warn(cond, "c") : void 0;'
			)
		);
	} );
} );
