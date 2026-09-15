import { describe, expect, it } from 'vitest';
import {
	findAddedLegacyJestTests,
	getTestEnvironmentName,
	getVitestTestsByProject,
} from '../discover-test-files.mjs';
import { sourceHasTestEnvironmentOverride } from '../test-environment-overrides.mjs';

describe( 'getTestEnvironmentName', () => {
	it( 'routes ordinary test filenames to Node', () => {
		expect( getTestEnvironmentName( 'example.test.ts' ) ).toBe( 'node' );
	} );

	it( 'routes *.jsdom.test.* filenames to JSDOM', () => {
		expect( getTestEnvironmentName( 'example.jsdom.test.tsx' ) ).toBe(
			'jsdom'
		);
	} );

	it( 'routes *.browser.test.* filenames to Browser Mode', () => {
		expect( getTestEnvironmentName( 'example.browser.test.js' ) ).toBe(
			'browser'
		);
	} );
} );

describe( 'getVitestTestsByProject', () => {
	it( 'routes every new test to Vitest without migration metadata', () => {
		expect(
			getVitestTestsByProject(
				[
					'example.test.ts',
					'example.jsdom.test.tsx',
					'example.browser.test.js',
				],
				{ jest: { files: [] } }
			)
		).toEqual( {
			browser: [ 'example.browser.test.js' ],
			jsdom: [ 'example.jsdom.test.tsx' ],
			node: [ 'example.test.ts' ],
		} );
	} );

	it( 'keeps only exact allowlisted JSDOM tests in Jest', () => {
		expect(
			getVitestTestsByProject(
				[ 'legacy.jsdom.test.tsx', 'new.jsdom.test.tsx' ],
				{ jest: { files: [ 'legacy.jsdom.test.tsx' ] } }
			)
		).toEqual( {
			browser: [],
			jsdom: [ 'new.jsdom.test.tsx' ],
			node: [],
		} );
	} );
} );

describe( 'findAddedLegacyJestTests', () => {
	it( 'allows the legacy Jest list to shrink but reports additions', () => {
		expect(
			findAddedLegacyJestTests(
				[ 'legacy-a.jsdom.test.js', 'new.jsdom.test.js' ],
				[ 'legacy-a.jsdom.test.js', 'legacy-b.jsdom.test.js' ]
			)
		).toEqual( [ 'new.jsdom.test.js' ] );
	} );
} );

describe( 'sourceHasTestEnvironmentOverride', () => {
	it( 'detects Jest and Vitest environment override comments', () => {
		for ( const source of [
			'/**\n * @jest-environment jsdom\n */\nconst value = true;',
			'// @vitest-environment jsdom\nconst value = true;',
		] ) {
			expect(
				sourceHasTestEnvironmentOverride( source, 'example.test.js' )
			).toBe( true );
		}
	} );

	it( 'ignores environment text outside override comments', () => {
		expect(
			sourceHasTestEnvironmentOverride(
				"const note = '@jest-environment jsdom';",
				'example.test.js'
			)
		).toBe( false );
		expect(
			sourceHasTestEnvironmentOverride(
				'// The @vitest-environment docblock was removed.\nconst value = true;',
				'example.test.js'
			)
		).toBe( false );
		expect(
			sourceHasTestEnvironmentOverride(
				'const fixture = `\n@jest-environment jsdom\n`;',
				'example.test.js'
			)
		).toBe( false );
	} );
} );
