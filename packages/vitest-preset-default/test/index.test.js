import { describe, expect, test } from 'vitest';
import preset from '../index.js';

describe( '@wordpress/vitest-preset-default', () => {
	const projects = Object.fromEntries(
		preset.test.projects.map( ( project ) => [
			project.test.name,
			project,
		] )
	);

	test( 'uses Node unless a filename selects another environment', () => {
		expect( preset.test.globals ).toBe( false );
		expect( projects.node.test.environment ).toBe( 'node' );
		expect( projects.node.test.exclude ).toContain(
			'**/*.jsdom.test.{js,jsx,ts,tsx,mjs,mts,cjs,cts}'
		);
		expect( projects.node.test.exclude ).toContain(
			'**/*.browser.test.{js,jsx,ts,tsx,mjs,mts,cjs,cts}'
		);
		expect( projects.jsdom.test ).toMatchObject( {
			name: 'jsdom',
			environment: 'jsdom',
		} );
		expect( projects.browser.test ).toMatchObject( {
			name: 'browser',
			browser: {
				enabled: true,
				headless: true,
				instances: [ { browser: 'chromium' } ],
			},
		} );
	} );

	test( 'mocks styles outside Browser Mode only', () => {
		expect( projects.node.resolve.alias ).toHaveLength( 1 );
		expect( projects.jsdom.resolve.alias ).toHaveLength( 1 );
		expect( projects.browser.resolve ).toBeUndefined();
	} );

	test( 'loads setup files in a deterministic order', () => {
		expect( preset.test.sequence ).toEqual( {
			hooks: 'list',
			setupFiles: 'list',
		} );
		expect( projects.node.test.setupFiles ).toHaveLength( 2 );
		expect( projects.jsdom.test.setupFiles ).toHaveLength( 2 );
		expect( projects.browser.test.setupFiles ).toHaveLength( 2 );
	} );
} );
