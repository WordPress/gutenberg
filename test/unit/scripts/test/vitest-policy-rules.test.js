import { describe, expect, it } from 'vitest';
import { validateVitestPolicy } from '../vitest-policy-rules.mjs';

function validate( source, options = {} ) {
	return validateVitestPolicy( {
		file: options.file ?? 'packages/example/test/example.test.js',
		project: options.project ?? 'browser',
		source,
		...options,
	} );
}

describe( 'Vitest environment policy', () => {
	it( 'rejects Browser Testing Library user-event', () => {
		expect(
			validate( "import userEvent from '@testing-library/user-event';" )
		).toEqual( [ expect.stringContaining( 'Browser tests must import' ) ] );
		const browserModule = [ 'vitest', 'browser' ].join( '/' );
		expect(
			validate( `import { userEvent } from '${ browserModule }';` )
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
} );
