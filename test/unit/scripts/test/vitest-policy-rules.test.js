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
	it( 'reports parser errors with the file path', () => {
		expect(
			validate( 'const value = ;', {
				file: 'packages/example/test/broken.test.js',
				project: 'node',
			} )
		).toEqual( [
			expect.stringContaining( 'packages/example/test/broken.test.js' ),
		] );
	} );

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

	it( 'rejects Browser fireEvent through a Testing Library namespace', () => {
		expectViolation(
			"import * as rtl from '@testing-library/react';\nrtl.fireEvent.click( document.body );",
			'allow fireEvent only'
		);
		expectValid(
			"import * as rtl from '@testing-library/react';\nfunction example() {\n\tconst rtl = { fireEvent: { click() {} } };\n\trtl.fireEvent.click();\n}",
			{ project: 'browser' }
		);
		expectViolation(
			"import * as RTL from '@testing-library/react';\nconst R = RTL;\nR.fireEvent.click( document.body );",
			'allow fireEvent only'
		);
	} );

	it( 'rejects jsdom browser APIs without a reason', () => {
		const source = 'new ResizeObserver( () => {} );';

		expectViolation( source, 'require Browser Mode', { project: 'jsdom' } );
		expectValid( source, {
			allowJsdomBrowserApis: true,
			project: 'jsdom',
		} );
	} );

	it( 'allows browser API-shaped properties on unrelated jsdom objects', () => {
		expectValid(
			'const fake = { scrollTop: 0 };\nfake.scrollTop;\nconst mockLayout = { getBoundingClientRect() {} };\nmockLayout.getBoundingClientRect();',
			{ project: 'jsdom' }
		);
	} );

	it( 'rejects animation APIs on DOM-derived jsdom objects', () => {
		expectViolation(
			"const element = document.createElement( 'div' );\nelement.animate( [], {} );",
			'require Browser Mode',
			{ project: 'jsdom' }
		);
		expectViolation( 'document.getAnimations();', 'require Browser Mode', {
			project: 'jsdom',
		} );
	} );

	it( 'tracks destructured DOM values and DOM prototypes', () => {
		for ( const source of [
			'const { body } = document;\nbody.offsetWidth;',
			'Element.prototype.getBoundingClientRect = () => ( {} );',
		] ) {
			expectViolation( source, 'require Browser Mode', {
				project: 'jsdom',
			} );
		}
	} );

	it( 'tracks Testing Library DOM results and later assignments', () => {
		for ( const source of [
			"import { screen } from '@testing-library/react';\nscreen.getByRole( 'button' ).getBoundingClientRect();",
			"import { screen } from '@testing-library/react';\nconst button = await screen.findByRole( 'button' );\nbutton.offsetWidth;",
			"import { findByRole } from '@testing-library/react';\nconst button = await findByRole( document.body, 'button' );\nbutton.offsetWidth;",
			"import * as RTL from '@testing-library/react';\nconst { screen: ui } = RTL;\nui.getByRole( 'button' ).offsetWidth;",
			"import { screen } from '@testing-library/react';\nscreen.getAllByRole( 'button' )[ 0 ].offsetWidth;",
			"import { screen } from '@testing-library/react';\nconst buttons = await screen.findAllByRole( 'button' );\nbuttons[ 0 ].offsetWidth;",
			"import * as RTL from '@testing-library/react';\nRTL.getByRole( document.body, 'button' ).offsetWidth;",
			"import * as RTL from '@testing-library/react';\nconst { getByRole } = RTL;\ngetByRole( document.body, 'button' ).offsetWidth;",
			'let element;\nelement = document.body;\nelement.offsetWidth;',
		] ) {
			expectViolation( source, 'require Browser Mode', {
				project: 'jsdom',
			} );
		}
	} );

	it( 'tracks computed-style aliases and document.defaultView', () => {
		for ( const source of [
			'document.defaultView.getComputedStyle( document.body );',
			'const { getComputedStyle: getStyle } = window;\ngetStyle( document.body );',
			'const getStyle = window.getComputedStyle;\ngetStyle( document.body );',
			'const view = document.defaultView;\nview.getComputedStyle( document.body );',
			'const { getComputedStyle } = document.defaultView;\ngetComputedStyle( document.body );',
			'const view = window;\nview.getComputedStyle( document.body );',
		] ) {
			expectViolation( source, 'computed style assertions', {
				project: 'jsdom',
			} );
		}
	} );

	it( 'allows browser-like properties on shadowed local values', () => {
		expectValid(
			"const element = document.createElement( 'div' );\nfunction example() {\n\tconst element = { scrollTop: 0 };\n\treturn element.scrollTop;\n}",
			{ project: 'jsdom' }
		);
		expectValid(
			'const window = { getComputedStyle() {} };\nwindow.getComputedStyle();',
			{ project: 'jsdom' }
		);
		expectValid(
			'const controller = window.wp.animations;\ncontroller.animate();',
			{ project: 'jsdom' }
		);
		expectValid( 'const { dataset } = document.body;\ndataset.scrollTop;', {
			project: 'jsdom',
		} );
	} );

	it( 'allows rendered UI for deterministic jsdom behavior', () => {
		const source =
			"import { render } from '@testing-library/react';\nrender( <div /> );";

		expectValid( source, { project: 'jsdom' } );
	} );

	it( 'rejects Browser spies on imported ESM namespace objects', () => {
		const source =
			"import { vi } from 'vitest';\nimport * as selectors from './selectors';\nvi.spyOn( selectors, 'getValue' );";

		expectViolation( source, 'imported ESM namespace objects' );
		expectViolation(
			"import { vi } from 'vitest';\nimport * as selectors from './selectors';\nconst alias = selectors;\nvi.spyOn( alias, 'getValue' );",
			'imported ESM namespace objects'
		);
		expectValid(
			"import { vi } from 'vitest';\nimport * as selectors from './selectors';\nconst { service } = selectors;\nvi.spyOn( service, 'getValue' );"
		);
	} );

	it( 'matches aliased Vitest vi APIs by binding', () => {
		expectViolation(
			"import { vi as mocker } from 'vitest';\nmocker.mock( './module' );",
			'must use vi.mock(import(...))',
			{ file: 'example.test.ts', project: 'node' }
		);
		expectViolation(
			"import { vi as mocker } from 'vitest';\nimport * as selectors from './selectors';\nmocker.spyOn( selectors, 'getValue' );",
			'imported ESM namespace objects'
		);
		expectViolation(
			"import * as Vitest from 'vitest';\nVitest.vi.mock( './module' );",
			'must use vi.mock(import(...))',
			{ file: 'example.test.ts', project: 'node' }
		);
		expectViolation(
			"import * as Vitest from 'vitest';\nconst V = Vitest;\nV.vi.mock( './module' );",
			'must use vi.mock(import(...))',
			{ file: 'example.test.ts', project: 'node' }
		);
	} );

	it( 'allows methods on shadowed vi objects', () => {
		expectValid(
			"import { vi } from 'vitest';\nfunction example() {\n\tconst vi = { mock() {} };\n\tvi.mock( './module' );\n}",
			{ file: 'example.test.ts', project: 'node' }
		);
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

	it( 'matches toHaveStyle only on Vitest expect results', () => {
		expectValid(
			"import { expect } from 'vitest';\nreporter.toHaveStyle( 1 );",
			{ project: 'jsdom' }
		);
		expectViolation(
			"import { expect } from 'vitest';\nexpect( element ).not.toHaveStyle( {} );",
			'toHaveStyle() requires',
			{ project: 'jsdom' }
		);
		expectViolation(
			"import { expect } from 'vitest';\nexpect.soft( element ).toHaveStyle( {} );",
			'toHaveStyle() requires',
			{ project: 'jsdom' }
		);
		expectViolation(
			"import * as Vitest from 'vitest';\nVitest.expect.soft( element ).toHaveStyle( {} );",
			'toHaveStyle() requires',
			{ project: 'jsdom' }
		);
		expectViolation(
			"import * as Vitest from 'vitest';\nconst { expect: check } = Vitest;\ncheck.poll( () => element ).toHaveStyle( {} );",
			'toHaveStyle() requires',
			{ project: 'jsdom' }
		);
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
			"import { expect } from 'vitest';\nexpect( element ).toHaveStyle( {} );",
			'toHaveStyle() requires',
			{
				isVitestTest: true,
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
					unexpected: {},
				},
				projects
			)
		).toEqual(
			expect.arrayContaining( [
				expect.stringContaining( 'contains unsupported keys' ),
				expect.stringContaining( 'browserFireEvent must be an object' ),
				expect.stringContaining( 'require a non-empty reason' ),
			] )
		);
	} );

	it( 'rejects policy exceptions that no longer suppress a violation', () => {
		const file = 'dom.jsdom.test.js';

		expect(
			validateVitestPolicyExceptions(
				{
					browserFireEvent: {},
					jsdomBrowserApis: { [ file ]: 'Tests browser APIs.' },
				},
				{
					browserTests: new Set(),
					jsdomTests: new Set( [ file ] ),
					usedExceptions: {
						browserFireEvent: new Set(),
						jsdomBrowserApis: new Set(),
					},
				}
			)
		).toEqual(
			expect.arrayContaining( [
				expect.stringContaining(
					`${ file }: jsdomBrowserApis exception is no longer needed`
				),
			] )
		);
	} );
} );
