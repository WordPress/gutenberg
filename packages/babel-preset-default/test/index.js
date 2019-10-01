/**
 * External dependencies
 */
import path from 'path';
import { readFileSync } from 'fs';
import { transform } from '@babel/core';

/**
 * Internal dependencies
 */
import babelPresetDefault from '../';

describe( 'Babel preset default', () => {
	test( 'transpilation works properly', () => {
		const input = readFileSync( path.join( __dirname, '/fixtures/input.js' ) );

		const output = transform( input, {
			configFile: false,
			envName: 'production',
			presets: [ babelPresetDefault ],
		} );

		expect( output.code ).toMatchSnapshot();

		// See https://github.com/WordPress/gutenberg/pull/17643.
		// Workaround for a problem with browserslist which was warning about outdated
		// dependencies (even though the dependencies were up-to-date.)
		/* eslint-disable-next-line no-console */
		console.warn.mockReset();
	} );
} );
