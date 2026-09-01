/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
	afterAll,
	afterEach as vitestAfterEach,
	beforeAll as vitestBeforeAll,
	beforeEach as vitestBeforeEach,
	describe,
	expect as vitestExpect,
	it,
	test,
	vi,
} from 'vitest';
import type { ExtendedMock } from '../types';

const require = createRequire( import.meta.url );

vi.restoreAllMocks();
vi.stubGlobal( 'afterEach', vitestAfterEach );
vi.stubGlobal( 'beforeAll', vitestBeforeAll );
vi.stubGlobal( 'beforeEach', vitestBeforeEach );
vi.stubGlobal( 'expect', vitestExpect );

await import( '../index' );

afterAll( () => vi.unstubAllGlobals() );

// The matchers replace the console methods with counting spies.
function getSpy( methodName: 'error' | 'info' | 'log' | 'warn' ) {
	return console[ methodName ] as unknown as ExtendedMock;
}

describe( 'jest-console', () => {
	it( 'keeps its spies active when Jest restores runtime mocks', () => {
		const jestPackageDirectory = dirname(
			require.resolve( 'jest/package.json' )
		);
		const fixturePath = join(
			import.meta.dirname,
			'fixtures/jest-restore-all-mocks.cjs'
		);
		const sourceEntryPath = join( import.meta.dirname, '../index.ts' );
		const config = JSON.stringify( {
			rootDir: process.cwd(),
			setupFilesAfterEnv: [ sourceEntryPath ],
			testEnvironment: 'node',
			testRegex: 'jest-restore-all-mocks\\.cjs$',
			transform: {
				'^.+\\.m?[jt]sx?$': join(
					process.cwd(),
					'test/unit/scripts/babel-transformer.js'
				),
			},
		} );
		const result = spawnSync(
			process.execPath,
			[
				join( jestPackageDirectory, 'bin/jest.js' ),
				'--config',
				config,
				'--runInBand',
				'--runTestsByPath',
				fixturePath,
			],
			{ encoding: 'utf8' }
		);

		if ( result.status !== 0 ) {
			throw new Error( `${ result.stdout }\n${ result.stderr }` );
		}

		vitestExpect( result.status ).toBe( 0 );
	} );

	describe.each( [
		[ 'error', 'toHaveErrored' ],
		[ 'info', 'toHaveInformed' ],
		[ 'log', 'toHaveLogged' ],
		[ 'warn', 'toHaveWarned' ],
	] as const )( 'console.%s', ( methodName, matcherName ) => {
		const matcherNameWith = `${ matcherName }With` as const;
		const message = `This is ${ methodName }!`;

		test( `${ matcherName } works`, () => {
			console[ methodName ]( message );

			vitestExpect( console )[ matcherName ]();
		} );

		test( `${ matcherName } works when not called`, () => {
			vitestExpect( console ).not[ matcherName ]();
			vitestExpect( () =>
				vitestExpect( console )[ matcherName ]()
			).toThrow( 'Expected mock function to be called.' );
		} );

		test( `${ matcherNameWith } works with arguments that match`, () => {
			console[ methodName ]( message );

			vitestExpect( console )[ matcherNameWith ]( message );
		} );

		test( `${ matcherNameWith } works when not called`, () => {
			vitestExpect( console ).not[ matcherNameWith ]( message );
			vitestExpect( () =>
				vitestExpect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:/s
			);
		} );

		test( `${ matcherNameWith } works with many arguments that do not match`, () => {
			console[ methodName ]( 'Unknown message.' );
			console[ methodName ]( message, 'Unknown param.' );

			vitestExpect( console ).not[ matcherNameWith ]( message );
			vitestExpect( () =>
				vitestExpect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:.*Unknown param./s
			);
		} );

		test( 'assertions number gets incremented after every matcher call', () => {
			const spy = getSpy( methodName );

			vitestExpect( spy.assertionsNumber ).toBe( 0 );

			console[ methodName ]( message );

			vitestExpect( console )[ matcherName ]();
			vitestExpect( spy.assertionsNumber ).toBe( 1 );

			vitestExpect( console )[ matcherNameWith ]( message );
			vitestExpect( spy.assertionsNumber ).toBe( 2 );
		} );

		describe( 'lifecycle', () => {
			vitestBeforeAll( () => {
				// Disable reason:
				// This is a difficult one to test, since the matcher's
				// own lifecycle is defined to run before ours. Infer
				// that we're being watched by testing the console
				// method as being a spy.
				// eslint-disable-next-line jest/no-standalone-expect
				vitestExpect(
					getSpy( methodName ).assertionsNumber
				).toBeGreaterThanOrEqual( 0 );
			} );

			// Disable reason:
			// See beforeAll implementation and explanation added there.
			it( 'captures logging in lifecycle', () => {} );
		} );
	} );
} );

/* eslint-enable no-console */
