import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from '@babel/core';
import { describe, expect, test } from 'vitest';
import babelPresetDefault from '../';

const currentDirectory = path.dirname( fileURLToPath( import.meta.url ) );

describe( 'Babel preset default', () => {
	test( 'transpilation works properly', () => {
		const filename = path.join( currentDirectory, 'fixtures/input.js' );
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
		const filename = path.join( currentDirectory, 'fixtures/polyfill.js' );
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
