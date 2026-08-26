import { describe, expect, it } from 'vitest';
import {
	validateVitestPolicy,
	validateVitestPolicyExceptions,
} from '../vitest-policy-rules.mjs';

function validate( source, options = {} ) {
	return validateVitestPolicy( {
		file: options.file ?? 'packages/example/test/example.test.js',
		project: options.project ?? 'browser',
		source,
		...options,
	} );
}

describe( 'Vitest policy rules', () => {
	it( 'rejects Browser Testing Library user-event', () => {
		expect(
			validate( "import userEvent from '@testing-library/user-event';" )
		).toEqual( [ expect.stringContaining( 'Browser tests must import' ) ] );
		expect(
			validate( "import { userEvent } from 'vitest/browser';" )
		).toEqual( [] );
	} );

	it( 'rejects unjustified Browser fireEvent', () => {
		const source =
			"import { fireEvent } from '@testing-library/react';\nfireEvent.click( document.body );";

		expect( validate( source ) ).toEqual( [
			expect.stringContaining( 'allow fireEvent only' ),
		] );
		expect( validate( source, { allowBrowserFireEvent: true } ) ).toEqual(
			[]
		);
	} );

	it( 'rejects jsdom browser APIs without a reason', () => {
		const source = 'new ResizeObserver( () => {} );';

		expect( validate( source, { project: 'jsdom' } ) ).toEqual( [
			expect.stringContaining( 'require Browser Mode' ),
		] );
		expect(
			validate( source, {
				allowJsdomBrowserApis: true,
				project: 'jsdom',
			} )
		).toEqual( [] );
	} );

	it( 'rejects new rendered UI jsdom tests outside the baseline', () => {
		const source =
			"import { render } from '@testing-library/react';\nrender( <div /> );";

		expect( validate( source, { project: 'jsdom' } ) ).toEqual( [
			expect.stringContaining( 'default to Browser Mode' ),
		] );
		expect(
			validate( source, { allowRenderedUi: true, project: 'jsdom' } )
		).toEqual( [] );
	} );

	it( 'rejects Browser spies on imported ESM namespace objects', () => {
		const source =
			"import * as selectors from './selectors';\nvi.spyOn( selectors, 'getValue' );";

		expect( validate( source ) ).toEqual( [
			expect.stringContaining( 'imported ESM namespace objects' ),
		] );
	} );

	it( 'rejects Browser runtime imports of Node built-ins', () => {
		for ( const source of [
			"import fs from 'fs';",
			"import 'node:path';",
			"await import('node:module');",
			'await import( `node:fs` );',
			"export { readFile } from 'node:fs';",
		] ) {
			expect( validate( source ) ).toEqual( [
				expect.stringContaining(
					'cannot import Node built-ins at runtime'
				),
			] );
		}
	} );

	it( 'allows Browser type-only imports of Node built-ins', () => {
		expect(
			validate(
				"import type { Stats } from 'node:fs';\nimport { type PathLike } from 'fs';\nimport type fs = require( 'node:fs' );",
				{ file: 'example.browser.test.ts' }
			)
		).toEqual( [] );
	} );

	it( 'rejects TypeScript CommonJS imports and exports', () => {
		expect(
			validate( "import fs = require( 'node:fs' );", {
				file: 'example.test.ts',
				project: 'node',
			} )
		).toEqual( [ expect.stringContaining( 'CommonJS import' ) ] );
		expect(
			validate( 'export = { value: true };', {
				file: 'example.test.ts',
				project: 'node',
			} )
		).toEqual( [ expect.stringContaining( 'CommonJS export' ) ] );
	} );

	it( 'rejects CommonJS exports', () => {
		for ( const source of [
			'exports.value = true;',
			'module.exports = {};',
			'module.exports.value = true;',
			"module[ 'exports' ].value = true;",
		] ) {
			expect( validate( source, { project: 'node' } ) ).toEqual( [
				expect.stringContaining( 'CommonJS export' ),
			] );
		}
	} );

	it( 'allows properties on local module-like objects', () => {
		expect(
			validate(
				'const module = { exports: {} };\nmodule.exports.value = true;\nconst exports = {};\nexports.value = true;',
				{ project: 'node' }
			)
		).toEqual( [] );
	} );

	it( 'enforces Vitest imports from module references', () => {
		expect(
			validate( 'const example = "import { it } from \'vitest\'";', {
				isVitestTest: true,
				project: 'node',
			} )
		).toEqual( [
			expect.stringContaining( 'no explicit import from vitest' ),
		] );
		expect(
			validate( "import { it } from 'vitest';", {
				isVitestTest: true,
				project: 'node',
			} )
		).toEqual( [] );
		expect(
			validate(
				"import { it } from 'vitest';\nimport { expect } from 'vitest/globals';",
				{ isVitestTest: true, project: 'node' }
			)
		).toEqual( [
			expect.stringContaining( 'vitest/globals is not allowed' ),
		] );
	} );

	it( 'matches Browser Mode imports by exact module source', () => {
		expect(
			validate(
				"import { it } from 'vitest';\nimport '@vitest/browser-playwright';\nconst note = \"import '@vitest/browser'\";",
				{ isVitestTest: true, project: 'jsdom' }
			)
		).toEqual( [] );
		expect(
			validate(
				"import { it } from 'vitest';\nimport { page } from '@vitest/browser';",
				{ isVitestTest: true, project: 'jsdom' }
			)
		).toEqual( [
			expect.stringContaining(
				'Browser Mode imports require a *.browser.test.* filename'
			),
		] );
	} );

	it( 'matches only test environment comment directives', () => {
		expect(
			validate(
				"/* @vitest-environment jsdom */\nimport { it } from 'vitest';",
				{ isVitestTest: true, project: 'node' }
			)
		).toEqual( [
			expect.stringContaining(
				'per-file test environment overrides are not allowed'
			),
		] );
		expect(
			validate(
				"// The @jest-environment docblock was removed.\nimport { it } from 'vitest';\nconst note = '@vitest-environment';",
				{ isVitestTest: true, project: 'node' }
			)
		).toEqual( [] );
	} );

	it( 'uses canonical project routing for environment suffixes', () => {
		expect(
			validate( "import { it } from 'vitest';", {
				file: 'example.browser.helper.test.js',
				isVitestTest: true,
				project: 'node',
			} )
		).toEqual( [
			expect.stringContaining(
				'environment names must use *.jsdom.test.* or *.browser.test.*'
			),
		] );
		expect(
			validate( "import { it } from 'vitest';", {
				file: 'example.browser.test.js',
				isVitestTest: true,
				project: 'browser',
			} )
		).toEqual( [] );
	} );

	it( 'allows animate methods on unrelated jsdom objects', () => {
		expect(
			validate( 'controller.animate();', { project: 'jsdom' } )
		).toEqual( [] );
	} );

	it( 'rejects the migrated per-file conventions', () => {
		expect(
			validate( "require( './module' );", { project: 'node' } )
		).toEqual( [ expect.stringContaining( 'unbound require()' ) ] );
		expect(
			validate( "import { vi } from 'vitest';\nvi.mock( './module' );", {
				file: 'example.test.ts',
				project: 'node',
			} )
		).toEqual( [
			expect.stringContaining( 'must use vi.mock(import(...))' ),
		] );
		expect(
			validate( 'getComputedStyle( document.body );', {
				project: 'jsdom',
			} )
		).toEqual( [ expect.stringContaining( 'computed style assertions' ) ] );
		expect(
			validate( 'expect( element ).toHaveStyle( {} );', {
				project: 'jsdom',
			} )
		).toEqual( [ expect.stringContaining( 'toHaveStyle() requires' ) ] );
		expect(
			validate( "import 'vitest';\ntest( 'example', () => {} );", {
				isVitestTest: true,
				project: 'node',
			} )
		).toEqual( [ expect.stringContaining( 'unbound Vitest API: test' ) ] );
	} );

	it( 'validates the policy exception schema', () => {
		const projects = {
			browserTests: new Set( [ 'browser.browser.test.js' ] ),
			jsdomTests: new Set( [ 'dom.jsdom.test.js' ] ),
		};
		expect(
			validateVitestPolicyExceptions(
				{
					browserFireEvent: {
						'browser.browser.test.js': 'Tests a raw event.',
					},
					jsdomBrowserApis: {},
					renderedUi: [ 'dom.jsdom.test.js' ],
				},
				projects
			)
		).toEqual( [] );
		expect(
			validateVitestPolicyExceptions(
				{
					browserFireEvent: [],
					jsdomBrowserApis: {
						'dom.jsdom.test.js': ' ',
					},
					renderedUi: [ 'dom.jsdom.test.js', 'dom.jsdom.test.js' ],
					unexpected: {},
				},
				projects
			)
		).toEqual(
			expect.arrayContaining( [
				expect.stringContaining( 'contains unsupported keys' ),
				expect.stringContaining( 'browserFireEvent must be an object' ),
				expect.stringContaining( 'require a non-empty reason' ),
				expect.stringContaining( 'renderedUi entries must be unique' ),
			] )
		);
	} );
} );
