import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { extractOptionFromArgs } = require( '../cli' );

describe( 'extractOptionFromArgs', () => {
	it( 'returns all arguments when the option is not passed', () => {
		expect(
			extractOptionFromArgs(
				[ '--config', 'playwright.config.ts' ],
				'--wp-env-config'
			)
		).toEqual( {
			value: undefined,
			args: [ '--config', 'playwright.config.ts' ],
		} );
	} );

	it( 'extracts the option with its value after an equals sign', () => {
		expect(
			extractOptionFromArgs(
				[
					'--config=playwright.config.ts',
					'--wp-env-config=../../.wp-env.test.json',
					'--ui',
				],
				'--wp-env-config'
			)
		).toEqual( {
			value: '../../.wp-env.test.json',
			args: [ '--config=playwright.config.ts', '--ui' ],
		} );
	} );

	it( 'extracts the option with its value as the next argument', () => {
		expect(
			extractOptionFromArgs(
				[
					'--config',
					'playwright.config.ts',
					'--wp-env-config',
					'../../.wp-env.test.json',
					'specs/editor.spec.js',
				],
				'--wp-env-config'
			)
		).toEqual( {
			value: '../../.wp-env.test.json',
			args: [
				'--config',
				'playwright.config.ts',
				'specs/editor.spec.js',
			],
		} );
	} );

	it( 'keeps an equals sign inside the value', () => {
		expect(
			extractOptionFromArgs(
				[ '--base-url=http://localhost:8991/?a=b' ],
				'--base-url'
			)
		).toEqual( {
			value: 'http://localhost:8991/?a=b',
			args: [],
		} );
	} );

	it( 'uses the last value when the option is passed more than once', () => {
		expect(
			extractOptionFromArgs(
				[
					'--base-url',
					'http://localhost:8889',
					'--ui',
					'--base-url=http://localhost:8991',
				],
				'--base-url'
			)
		).toEqual( {
			value: 'http://localhost:8991',
			args: [ '--ui' ],
		} );
	} );

	it( 'leaves other options that start with the same name', () => {
		expect(
			extractOptionFromArgs(
				[ '--base-url-other=x', '--base-url', 'http://localhost:8991' ],
				'--base-url'
			)
		).toEqual( {
			value: 'http://localhost:8991',
			args: [ '--base-url-other=x' ],
		} );
	} );

	it.each( [
		[ 'without a value', [ '--ui', '--wp-env-config' ] ],
		[ 'with an empty value', [ '--wp-env-config=', '--ui' ] ],
	] )( 'returns null for the option %s', ( _, args ) => {
		expect( extractOptionFromArgs( args, '--wp-env-config' ) ).toEqual( {
			value: null,
			args: [ '--ui' ],
		} );
	} );
} );
