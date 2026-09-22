import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build as esbuild } from 'esbuild';
import { build as vite, createServer } from 'vite';
import { SourceMapConsumer } from 'source-map';
import MagicString from 'magic-string';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import esbuildPlugin from '../../esbuild-plugins/esbuild-ds-token-fallbacks.mjs';
import vitePlugin from '../../vite-plugins/vite-ds-token-fallbacks.mjs';

let directory: string;

beforeEach( async () => {
	directory = await mkdtemp( join( tmpdir(), 'theme-js-plugins-' ) );
} );

afterEach( async () => {
	await rm( directory, { recursive: true, force: true } );
} );

async function bundle( bundler: 'esbuild' | 'Vite', filename: string ) {
	if ( bundler === 'esbuild' ) {
		const result = await esbuild( {
			entryPoints: [ filename ],
			outfile: join( directory, 'bundle.js' ),
			bundle: true,
			write: false,
			format: 'cjs',
			sourcemap: true,
			plugins: [ esbuildPlugin ],
		} );
		return {
			code: result.outputFiles!.find( ( file ) =>
				file.path.endsWith( '.js' )
			)!.text,
			map: result.outputFiles!.find( ( file ) =>
				file.path.endsWith( '.map' )
			)!.text,
		};
	}
	const result = await vite( {
		configFile: false,
		root: directory,
		logLevel: 'silent',
		plugins: [
			{
				name: 'preceding-transform',
				enforce: 'pre',
				transform( code, id ) {
					if ( id !== filename ) {
						return null;
					}
					const output = new MagicString( code ).prepend(
						'// Earlier transform\n\n'
					);
					return {
						code: output.toString(),
						map: output.generateMap( {
							source: id,
							includeContent: true,
							hires: true,
						} ),
					};
				},
			},
			vitePlugin(),
		],
		oxc: { jsx: { runtime: 'classic', pragma: 'h' } },
		build: {
			write: false,
			minify: false,
			sourcemap: true,
			lib: { entry: filename, formats: [ 'cjs' ] },
		},
	} );
	const output = Array.isArray( result ) ? result[ 0 ] : result;
	if ( ! ( 'output' in output ) ) {
		throw new Error( 'Expected a single Vite build output.' );
	}
	const chunk = output.output.find( ( item ) => item.type === 'chunk' )!;
	return { code: chunk.code, map: chunk.map!.toString() };
}

function positionOf( source: string, text: string ) {
	const offset = source.indexOf( text );
	expect( offset ).toBeGreaterThanOrEqual( 0 );
	const lines = source.slice( 0, offset ).split( '\n' );
	return { line: lines.length, column: lines.at( -1 )!.length };
}

describe.each( [ 'esbuild', 'Vite' ] as const )(
	'%s token fallback builds',
	( bundler ) => {
		it( 'builds TypeScript and JSX with correct string, template, and raw-template values', async () => {
			const source = String.raw`
/** @jsx h */
const h = (_tag: string, props: { title: string }) => props.title;
// var(--wpds-not-a-token)
export const pattern = /var(--wpds-not-a-token)/.source;
export const raw = String.raw\`line\nvar(--wpds-typography-font-family-mono)\`;
export const cooked: string = 'var(--wpds-typography-font-family-mono)';
export const jsx = <div title="var(--wpds-typography-font-family-mono)" />;
export const manual = 'var(--wpds-dimension-gap-sm,)';
`.replaceAll( '\\`', '`' );
			const filename = join( directory, 'fixture.tsx' );
			await writeFile( filename, source );
			const result = await bundle( bundler, filename );
			const module = { exports: {} };
			runInNewContext( result.code, { module, exports: module.exports } );
			const font =
				'var(--wpds-typography-font-family-mono, "Menlo", "Consolas", monaco, monospace)';
			expect( module.exports ).toMatchObject( {
				pattern: 'var(--wpds-not-a-token)',
				raw: `line\\n${ font }`,
				cooked: font,
				jsx: font,
				manual: 'var(--wpds-dimension-gap-sm,)',
			} );
		} );

		it( 'maps code after a fallback to its original line and column', async () => {
			const source =
				'export function fail() { const css = "var(--wpds-typography-font-family-mono)"; throw new Error(css); }\n';
			const filename = join( directory, 'fixture.ts' );
			await writeFile( filename, source );
			const result = await bundle( bundler, filename );
			const consumer = new SourceMapConsumer( JSON.parse( result.map ) );
			const original = consumer.originalPositionFor(
				positionOf( result.code, 'throw new Error' )
			);
			expect( original ).toMatchObject(
				positionOf( source, 'throw new Error' )
			);
			expect( original.source ).toMatch( /fixture\.ts$/ );
			expect( consumer.sourceContentFor( original.source! ) ).toBe(
				source
			);
		} );

		it( 'preserves TypeScript assertions and runtime namespace values', async () => {
			const source =
				'namespace Styles { export const gap = <string>"var(--wpds-dimension-gap-sm)"; } export const gap = Styles.gap;';
			const filename = join( directory, 'fixture.ts' );
			await writeFile( filename, source );
			const result = await bundle( bundler, filename );
			const module = { exports: {} };
			runInNewContext( result.code, { module, exports: module.exports } );
			expect( module.exports ).toMatchObject( {
				gap: 'var(--wpds-dimension-gap-sm, 8px)',
			} );
		} );
	}
);

it( 'transforms Vite query-string modules while preserving raw and URL imports', async () => {
	const source = 'export const css = "var(--wpds-dimension-gap-sm)";';
	await writeFile( join( directory, 'fixture.ts' ), source );
	const server = await createServer( {
		configFile: false,
		root: directory,
		logLevel: 'silent',
		plugins: [ vitePlugin() ],
		server: { middlewareMode: true, watch: null },
	} );
	try {
		const result = await server.transformRequest( '/fixture.ts?custom=1' );
		expect( result?.code ).toContain( 'var(--wpds-dimension-gap-sm, 8px)' );
		expect( result?.map ).toMatchObject( { sourcesContent: [ source ] } );
		const raw = await server.transformRequest( '/fixture.ts?raw' );
		expect( raw?.code ).toContain( JSON.stringify( source ) );
		const url = await server.transformRequest( '/fixture.ts?url' );
		expect( url?.code ).not.toContain( 'var(--wpds-' );
	} finally {
		await server.close();
	}
} );
