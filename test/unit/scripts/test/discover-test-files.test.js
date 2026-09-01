import { describe, expect, it } from 'vitest';
import { getTestEnvironmentName } from '../discover-test-files.mjs';
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
