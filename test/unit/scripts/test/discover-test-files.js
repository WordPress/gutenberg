/**
 * External dependencies
 */
import { describe, expect, test } from 'vitest';

/**
 * Internal dependencies
 */
import {
	assertVitestProjectNames,
	canonicalizeRenamedTestFiles,
	excludeExplicitFileOverrides,
	findOverlappingVitestProjectTests,
} from '../discover-test-files.mjs';

describe( 'Vitest project routing', () => {
	test( 'accepts the browser, jsdom, and node projects', () => {
		expect( () =>
			assertVitestProjectNames( 'vitest.projects', {
				browser: {},
				jsdom: {},
				node: {},
			} )
		).not.toThrow();
	} );

	test( 'rejects a missing Vitest project', () => {
		expect( () =>
			assertVitestProjectNames( 'vitest.projects', {
				jsdom: {},
				node: {},
			} )
		).toThrow(
			'vitest.projects must define exactly these projects: browser, jsdom, node.'
		);
	} );

	test( 'rejects an unknown Vitest project', () => {
		expect( () =>
			assertVitestProjectNames( 'vitest.projects', {
				browser: {},
				jsdom: {},
				node: {},
				worker: {},
			} )
		).toThrow(
			'vitest.projects must define exactly these projects: browser, jsdom, node.'
		);
	} );

	test( 'reports tests owned by multiple projects', () => {
		expect(
			findOverlappingVitestProjectTests( {
				browser: [ 'packages/components/src/test/index.js' ],
				jsdom: [ 'packages/components/src/test/index.js' ],
				node: [ 'tools/example/test/index.js' ],
			} )
		).toEqual( [
			'packages/components/src/test/index.js: browser, jsdom',
		] );
	} );

	test( 'lets explicit file ownership override directory ownership', () => {
		const manifest = {
			vitest: {
				projects: {
					browser: {
						files: [ 'packages/example/test/browser.js' ],
					},
					jsdom: {
						files: [],
					},
					node: {
						files: [],
					},
				},
			},
			added: {
				vitest: {
					browser: [],
					jsdom: [],
					node: [],
				},
			},
		};
		const directoryTests = [
			'packages/example/test/browser.js',
			'packages/example/test/jsdom.js',
		];

		expect(
			excludeExplicitFileOverrides( 'jsdom', directoryTests, manifest )
		).toEqual( [ 'packages/example/test/jsdom.js' ] );
	} );

	test( 'preserves baseline identities for renamed tests', () => {
		expect(
			canonicalizeRenamedTestFiles(
				[
					'packages/example/src/test/unchanged.js',
					'packages/example/src/test/renamed.jsx',
				],
				{
					'packages/example/src/test/renamed.js':
						'packages/example/src/test/renamed.jsx',
				}
			)
		).toEqual( [
			'packages/example/src/test/renamed.js',
			'packages/example/src/test/unchanged.js',
		] );
	} );
} );
