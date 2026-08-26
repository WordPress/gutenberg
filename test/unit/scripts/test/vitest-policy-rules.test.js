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

function expectViolation( source, message, options ) {
	expect( validate( source, options ) ).toEqual( [
		expect.stringContaining( message ),
	] );
}

function expectValid( source, options ) {
	expect( validate( source, options ) ).toEqual( [] );
}

describe( 'Vitest policy rules', () => {
	it( 'rejects Browser Testing Library user-event', () => {
		expectViolation(
			"import userEvent from '@testing-library/user-event';",
			'Browser tests must import'
		);
		expectValid( "import { userEvent } from 'vitest/browser';" );
	} );

	it( 'rejects unjustified Browser fireEvent', () => {
		const source =
			"import { fireEvent } from '@testing-library/react';\nfireEvent.click( document.body );";

		expectViolation( source, 'allow fireEvent only' );
		expectValid( source, {
			allowBrowserFireEvent: true,
		} );
	} );

	it( 'rejects jsdom browser APIs without a reason', () => {
		const source = 'new ResizeObserver( () => {} );';

		expectViolation( source, 'require Browser Mode', { project: 'jsdom' } );
		expectValid( source, {
			allowJsdomBrowserApis: true,
			project: 'jsdom',
		} );
	} );

	it( 'rejects new rendered UI jsdom tests outside the baseline', () => {
		const source =
			"import { render } from '@testing-library/react';\nrender( <div /> );";

		expectViolation( source, 'default to Browser Mode', {
			project: 'jsdom',
		} );
		expectValid( source, { allowRenderedUi: true, project: 'jsdom' } );
	} );

	it( 'rejects Browser spies on imported ESM namespace objects', () => {
		const source =
			"import * as selectors from './selectors';\nvi.spyOn( selectors, 'getValue' );";

		expectViolation( source, 'imported ESM namespace objects' );
	} );

	it( 'rejects Browser runtime imports of Node built-ins', () => {
		for ( const source of [
			"import fs from 'fs';",
			"import 'node:path';",
			"await import('node:module');",
			'await import( `node:fs` );',
			"export { readFile } from 'node:fs';",
		] ) {
			expectViolation(
				source,
				'cannot import Node built-ins at runtime'
			);
		}
	} );

	it( 'allows Browser type-only imports of Node built-ins', () => {
		expectValid(
			"import type { Stats } from 'node:fs';\nimport { type PathLike } from 'fs';\nimport type fs = require( 'node:fs' );",
			{ file: 'example.browser.test.ts' }
		);
	} );

	it( 'rejects TypeScript CommonJS imports and exports', () => {
		expectViolation(
			"import fs = require( 'node:fs' );",
			'CommonJS import',
			{
				file: 'example.test.ts',
				project: 'node',
			}
		);
		expectViolation( 'export = { value: true };', 'CommonJS export', {
			file: 'example.test.ts',
			project: 'node',
		} );
	} );

	it( 'rejects CommonJS exports', () => {
		for ( const source of [
			'exports.value = true;',
			'module.exports = {};',
			'module.exports.value = true;',
			"module[ 'exports' ].value = true;",
		] ) {
			expectViolation( source, 'CommonJS export', { project: 'node' } );
		}
	} );

	it( 'allows properties on local module-like objects', () => {
		expectValid(
			'const module = { exports: {} };\nmodule.exports.value = true;\nconst exports = {};\nexports.value = true;',
			{ project: 'node' }
		);
	} );

	it( 'enforces Vitest imports from module references', () => {
		expectViolation(
			'const example = "import { it } from \'vitest\'";',
			'no explicit import from vitest',
			{
				isVitestTest: true,
				project: 'node',
			}
		);
		expectValid( "import { it } from 'vitest';", {
			isVitestTest: true,
			project: 'node',
		} );
		expectViolation(
			"import { it } from 'vitest';\nimport { expect } from 'vitest/globals';",
			'vitest/globals is not allowed',
			{ isVitestTest: true, project: 'node' }
		);
	} );

	it( 'matches Browser Mode imports by exact module source', () => {
		expectValid(
			"import { it } from 'vitest';\nimport '@vitest/browser-playwright';\nconst note = \"import '@vitest/browser'\";",
			{ isVitestTest: true, project: 'jsdom' }
		);
		expectViolation(
			"import { it } from 'vitest';\nimport { page } from '@vitest/browser';",
			'Browser Mode imports require a *.browser.test.* filename',
			{ isVitestTest: true, project: 'jsdom' }
		);
	} );

	it( 'matches only test environment comment directives', () => {
		expectViolation(
			"/* @vitest-environment jsdom */\nimport { it } from 'vitest';",
			'per-file test environment overrides are not allowed',
			{ isVitestTest: true, project: 'node' }
		);
		expectValid(
			"// The @jest-environment docblock was removed.\nimport { it } from 'vitest';\nconst note = '@vitest-environment';",
			{ isVitestTest: true, project: 'node' }
		);
	} );

	it( 'uses canonical project routing for environment suffixes', () => {
		expectViolation(
			"import { it } from 'vitest';",
			'environment names must use *.jsdom.test.* or *.browser.test.*',
			{
				file: 'example.browser.helper.test.js',
				isVitestTest: true,
				project: 'node',
			}
		);
		expectValid( "import { it } from 'vitest';", {
			file: 'example.browser.test.js',
			isVitestTest: true,
			project: 'browser',
		} );
	} );

	it( 'allows animate methods on unrelated jsdom objects', () => {
		expectValid( 'controller.animate();', { project: 'jsdom' } );
	} );

	it( 'rejects the migrated per-file conventions', () => {
		expectViolation( "require( './module' );", 'unbound require()', {
			project: 'node',
		} );
		expectViolation(
			"import { vi } from 'vitest';\nvi.mock( './module' );",
			'must use vi.mock(import(...))',
			{
				file: 'example.test.ts',
				project: 'node',
			}
		);
		expectViolation(
			'getComputedStyle( document.body );',
			'computed style assertions',
			{
				project: 'jsdom',
			}
		);
		expectViolation(
			'expect( element ).toHaveStyle( {} );',
			'toHaveStyle() requires',
			{
				project: 'jsdom',
			}
		);
		expectViolation(
			"import 'vitest';\ntest( 'example', () => {} );",
			'unbound Vitest API: test',
			{
				isVitestTest: true,
				project: 'node',
			}
		);
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
