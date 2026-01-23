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
		const filename = path.join( __dirname, '/fixtures/input.js' );
		const input = readFileSync( filename );

		const output = transform( input, {
			filename,
			configFile: false,
			envName: 'production',
			presets: [ babelPresetDefault ],
		} );

		expect( output.code ).toMatchSnapshot();
	} );

	test( 'transpilation includes magic comment when using the addPolyfillComments option', () => {
		const filename = path.join( __dirname, '/fixtures/polyfill.js' );
		const input = readFileSync( filename );

		const output = transform( input, {
			filename,
			configFile: false,
			envName: 'production',
			presets: [ babelPresetDefault ],
			caller: {
				name: 'WP_BUILD_MAIN',
				addPolyfillComments: true,
			},
		} );

		expect( output.code ).toContain( '/* wp:polyfill */' );
	} );
} );
