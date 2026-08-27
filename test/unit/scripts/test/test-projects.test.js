import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	discoverTestFiles,
	getVitestProjectName,
	getVitestTestsByProject,
} from '../test-projects.mjs';

const ROOT_DIR = path.resolve( import.meta.dirname, '../../../..' );

describe( 'Vitest project routing', () => {
	it( 'routes ordinary test filenames to Node', () => {
		expect( getVitestProjectName( 'example.test.ts' ) ).toBe( 'node' );
	} );

	it( 'routes *.jsdom.test.* filenames to jsdom', () => {
		expect( getVitestProjectName( 'example.jsdom.test.tsx' ) ).toBe(
			'jsdom'
		);
	} );

	it( 'routes *.browser.test.* filenames to Browser Mode', () => {
		expect( getVitestProjectName( 'example.browser.test.js' ) ).toBe(
			'browser'
		);
	} );

	it( 'assigns every discovered test to exactly one project', () => {
		const discoveredTests = discoverTestFiles( ROOT_DIR );
		const testsByProject = getVitestTestsByProject( ROOT_DIR );
		const routedTests = Object.values( testsByProject ).flat();

		expect( new Set( routedTests ).size ).toBe( routedTests.length );
		expect( [ ...new Set( routedTests ) ].sort() ).toEqual(
			discoveredTests
		);
		expect( testsByProject.browser.length ).toBeGreaterThan( 0 );
		expect(
			testsByProject.browser.every(
				( testPath ) => getVitestProjectName( testPath ) === 'browser'
			)
		).toBe( true );
	} );
} );
