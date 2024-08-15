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
} );
