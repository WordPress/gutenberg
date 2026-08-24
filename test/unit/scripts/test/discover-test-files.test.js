import { describe, expect, it } from 'vitest';
import { getVitestProjectName } from '../discover-test-files.mjs';

describe( 'getVitestProjectName', () => {
	it( 'routes ordinary test filenames to Node', () => {
		expect( getVitestProjectName( 'example.test.ts' ) ).toBe( 'node' );
	} );

	it( 'routes *.jsdom.test.* filenames to JSDOM', () => {
		expect( getVitestProjectName( 'example.jsdom.test.tsx' ) ).toBe(
			'jsdom'
		);
	} );

	it( 'routes *.browser.test.* filenames to Browser Mode', () => {
		expect( getVitestProjectName( 'example.browser.test.js' ) ).toBe(
			'browser'
		);
	} );
} );
