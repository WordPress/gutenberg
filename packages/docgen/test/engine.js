import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import engine from '../lib/engine';

describe( 'Engine', () => {
	it( 'should return a void IR for undefined code', () => {
		const { ir } = engine( undefined );
		expect( ir ).toHaveLength( 0 );
	} );

	it( 'parses JSX in JavaScript without a Babel configuration', () => {
		const { ast } = engine(
			'example.js',
			'export const element = <div />;'
		);

		expect( ast.body[ 0 ].declaration.declarations[ 0 ].init.type ).toBe(
			'JSXElement'
		);
	} );

	it( 'parses TypeScript type assertions without enabling JSX', () => {
		const { ast } = engine(
			'example.ts',
			'export const value = <number>1;'
		);

		expect( ast.body[ 0 ].declaration.declarations[ 0 ].init.type ).toBe(
			'TSTypeAssertion'
		);
	} );

	it( 'honors custom Babel parser options', () => {
		const project = mkdtempSync( join( tmpdir(), 'docgen-babel-config-' ) );

		try {
			writeFileSync(
				join( project, 'babel.config.json' ),
				JSON.stringify( { parserOpts: { plugins: [ 'flow' ] } } )
			);

			// A separate process gives Babel the consumer's project root.
			const output = execFileSync(
				process.execPath,
				[
					'-e',
					`const engine = require(process.argv[1]);
					process.stdout.write(JSON.stringify(engine('example.js', 'export const value: number = 1;').ast));`,
					fileURLToPath(
						new URL( '../lib/engine.js', import.meta.url )
					),
				],
				{ cwd: project, encoding: 'utf8' }
			);
			const ast = JSON.parse( output );

			expect(
				ast.body[ 0 ].declaration.declarations[ 0 ].id.typeAnnotation
					.typeAnnotation.type
			).toBe( 'NumberTypeAnnotation' );
		} finally {
			rmSync( project, { recursive: true, force: true } );
		}
	} );
} );
