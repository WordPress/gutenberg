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

	it.each( [ 'js', 'jsx' ] )( 'parses JSX in .%s files', ( extension ) => {
		const { ast } = engine(
			`example.${ extension }`,
			'export const element = <div />;'
		);

		expect( ast.body[ 0 ].declaration.declarations[ 0 ].init.type ).toBe(
			'JSXElement'
		);
	} );

	it.each( [ 'ts', 'mts', 'cts' ] )(
		'parses type assertions in .%s files without enabling JSX',
		( extension ) => {
			const { ast } = engine(
				`example.${ extension }`,
				'export const value = <number>1;'
			);

			expect(
				ast.body[ 0 ].declaration.declarations[ 0 ].init.type
			).toBe( 'TSTypeAssertion' );
		}
	);

	it( 'parses JSX in TypeScript files', () => {
		const { ast } = engine(
			'example.tsx',
			'export const element: JSX.Element = <div />;'
		);

		const declaration = ast.body[ 0 ].declaration.declarations[ 0 ];
		expect( declaration.init.type ).toBe( 'JSXElement' );
		expect( declaration.id.typeAnnotation.typeAnnotation.type ).toBe(
			'TSTypeReference'
		);
	} );

	it( 'parses JSX and TypeScript without loading project Babel configuration', () => {
		const project = mkdtempSync( join( tmpdir(), 'docgen-babel-config-' ) );

		try {
			writeFileSync(
				join( project, 'babel.config.cjs' ),
				'throw new Error("Babel configuration must not be loaded");'
			);

			// Run from a consumer project so configuration discovery would find it.
			const output = execFileSync(
				process.execPath,
				[
					'-e',
					`const engine = require(process.argv[1]);
					process.stdout.write(JSON.stringify([
						engine('example.js', 'export const element = <div />;').ast,
						engine('example.ts', 'export const value = <number>1;').ast,
					]));`,
					fileURLToPath(
						new URL( '../lib/engine.js', import.meta.url )
					),
				],
				{ cwd: project, encoding: 'utf8' }
			);
			const [ jsx, typescript ] = JSON.parse( output );

			expect(
				jsx.body[ 0 ].declaration.declarations[ 0 ].init.type
			).toBe( 'JSXElement' );
			expect(
				typescript.body[ 0 ].declaration.declarations[ 0 ].init.type
			).toBe( 'TSTypeAssertion' );
		} finally {
			rmSync( project, { recursive: true, force: true } );
		}
	} );
} );
