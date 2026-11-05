import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const BUILD_SCRIPT = path.join( import.meta.dirname, '..', 'build.mjs' );

const FILES = {
	'package.json': { name: 'fixture', private: true, wpPlugin: {} },
	'node_modules/plain-cjs/index.js':
		'module.exports = function plain() { return "plain"; };',
	'packages/circular/package.json': {
		name: 'circular',
		main: 'build/index.cjs',
		module: 'build-module/index.mjs',
	},
	'packages/circular/src/index.js': `
		import helper from './helper';
		import * as namedOnly from './named-only';
		import plain from 'plain-cjs';
		export default function main( value ) {
			return 'main:' + value;
		}
		export { helper, namedOnly, plain };
	`,
	'packages/circular/src/helper.js': `
		import main from './index';
		export default function helper( value ) {
			return main( value ) + ':helper';
		}
	`,
	'packages/circular/src/named-only.js': 'export const named = 1;',
};

describe( 'CommonJS output', () => {
	let dir;
	let circular;

	beforeAll( async () => {
		dir = await mkdtemp( path.join( tmpdir(), 'wp-build-cjs-' ) );
		for ( const [ file, content ] of Object.entries( FILES ) ) {
			const filePath = path.join( dir, file );
			await mkdir( path.dirname( filePath ), { recursive: true } );
			await writeFile(
				filePath,
				typeof content === 'string'
					? content
					: JSON.stringify( content )
			);
		}
		await promisify( execFile )( process.execPath, [ BUILD_SCRIPT ], {
			cwd: dir,
		} );
		circular = createRequire( import.meta.url )(
			path.join( dir, 'packages/circular/build/index.cjs' )
		);
	}, 60_000 );

	afterAll( async () => {
		await rm( dir, { recursive: true, force: true } );
	} );

	test( 'keeps a default import live across a circular import', () => {
		expect( circular.helper( 'value' ) ).toBe( 'main:value:helper' );
	} );

	test( 'does not add a default to a namespace import of an ES module', () => {
		expect( circular.namedOnly ).not.toHaveProperty( 'default' );
		expect( circular.namedOnly.named ).toBe( 1 );
	} );

	test( 'imports the exports of a CommonJS module as its default', () => {
		expect( circular.plain() ).toBe( 'plain' );
	} );
} );
