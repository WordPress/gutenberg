/**
 * External dependencies
 */
import { describe, expect, test } from 'vitest';

/**
 * Internal dependencies
 */
import {
	assertVitestProjectNames,
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
} );
