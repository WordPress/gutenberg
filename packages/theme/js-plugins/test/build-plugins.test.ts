import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build as esbuild, transform as esbuildTransform } from 'esbuild';
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
			target: 'es2022',
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
			target: 'es2022',
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

		it( 'preserves TypeScript enum member names', async () => {
			const filename = join( directory, 'fixture.ts' );
			await writeFile(
				filename,
				'enum Tokens { "var(--wpds-not-a-token)" = "var(--wpds-dimension-gap-sm)" } export const gap = Tokens["var(--wpds-not-a-token)"];'
			);
			const result = await bundle( bundler, filename );
			const module = { exports: {} };
			runInNewContext( result.code, { module, exports: module.exports } );
			expect( module.exports ).toMatchObject( {
				gap: 'var(--wpds-dimension-gap-sm, 8px)',
			} );
		} );

		it( 'preserves string-named re-exports', async () => {
			await writeFile(
				join( directory, 'provider.js' ),
				'const value = "var(--wpds-dimension-gap-sm)"; export { value as "var(--wpds-dimension-gap-sm)" };'
			);
			const filename = join( directory, 'fixture.js' );
			await writeFile(
				filename,
				'export { "var(--wpds-dimension-gap-sm)" as gap } from "./provider.js";'
			);
			const result = await bundle( bundler, filename );
			const module = { exports: {} };
			runInNewContext( result.code, { module, exports: module.exports } );
			expect( module.exports ).toMatchObject( {
				gap: 'var(--wpds-dimension-gap-sm, 8px)',
			} );
		} );

		it.each( [
			[
				'auto-accessors',
				'export class Styles { accessor gap = "var(--wpds-dimension-gap-sm)"; } export const gap = new Styles().gap;',
			],
			[
				'parameter decorators',
				'function inject(...args: unknown[]) {} export @inject class Styles { constructor(@inject value: string) {} } export const gap = "var(--wpds-dimension-gap-sm)";',
			],
			[
				'import assertions',
				'import config from "./config.json" assert { type: "json" }; export const gap = config.prefix + "var(--wpds-dimension-gap-sm)";',
			],
			[
				'decorator non-null assertions',
				'function inject(...args: unknown[]) {} function factory<T>() { return inject; } @factory!<string>() class Legacy {} export @inject! class Modern {} class Styles { @inject! gap = "var(--wpds-dimension-gap-sm)"; } export const gap = new Styles().gap;',
			],
		] )( 'builds supported %s syntax', async ( _syntax, source ) => {
			await writeFile(
				join( directory, 'tsconfig.json' ),
				JSON.stringify( {
					compilerOptions: { experimentalDecorators: true },
				} )
			);
			await writeFile(
				join( directory, 'config.json' ),
				'{"prefix":""}'
			);
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

it( 'builds non-strict CommonJS syntax', async () => {
	const filename = join( directory, 'fixture.cjs' );
	await writeFile(
		filename,
		'function last(value, value) { return value; } const octal = 010; module.exports = { gap: last(octal, "var(--wpds-dimension-gap-sm)"), octal };'
	);
	const result = await bundle( 'esbuild', filename );
	const module = { exports: {} };
	runInNewContext( result.code, { module, exports: module.exports } );
	expect( module.exports ).toEqual( {
		gap: 'var(--wpds-dimension-gap-sm, 8px)',
		octal: 8,
	} );
} );

it.each( [
	'import source wasm from "external.wasm"; export { wasm };',
	'export const wasm = import.source("external.wasm");',
	'import defer * as mod from "external"; export { mod };',
	'export const mod = import.defer("external");',
] )( 'builds supported import phases: %s', async ( statement ) => {
	const filename = join( directory, 'fixture.js' );
	await writeFile(
		filename,
		`${ statement } export const gap = "var(--wpds-dimension-gap-sm)";`
	);
	const result = await esbuild( {
		entryPoints: [ filename ],
		bundle: true,
		format: 'esm',
		target: 'esnext',
		write: false,
		external: [ 'external', 'external.wasm' ],
		plugins: [ esbuildPlugin ],
	} );
	expect( result.outputFiles![ 0 ].text ).toContain(
		'var(--wpds-dimension-gap-sm, 8px)'
	);
} );

it( 'builds JSX in JavaScript files containing only manual fallbacks', async () => {
	const filename = join( directory, 'fixture.js' );
	await writeFile(
		filename,
		'const React = { createElement: (_tag, props) => props.style.gap }; export const gap = <div style={{ gap: "var(--wpds-dimension-gap-sm, 8px)" }} />;'
	);
	const result = await bundle( 'esbuild', filename );
	const module = { exports: {} };
	runInNewContext( result.code, { module, exports: module.exports } );
	expect( module.exports ).toMatchObject( {
		gap: 'var(--wpds-dimension-gap-sm, 8px)',
	} );
} );

it.each( [ 'base64', 'percent-encoded', 'external', 'indexed' ] )(
	'preserves original sources through %s esbuild input maps',
	async ( encoding ) => {
		const sourceDirectory = join(
			await realpath( directory ),
			'project #1%'
		);
		await mkdir( sourceDirectory );
		const source =
			'export function fail(): never { const css: string = "var(--wpds-typography-font-family-mono)"; throw new Error(css); }\n';
		const compiled = await esbuildTransform( source, {
			loader: 'ts',
			sourcefile: 'original.ts',
			sourcemap: 'external',
		} );
		let directive;
		const external = encoding === 'external' || encoding === 'indexed';
		if ( external ) {
			await mkdir( join( sourceDirectory, 'maps' ) );
			await mkdir( join( sourceDirectory, 'src' ) );
			await writeFile(
				join( sourceDirectory, 'src/original.ts' ),
				source
			);
			let map = JSON.parse( compiled.map );
			map.sourceRoot = '../src';
			if ( encoding === 'indexed' ) {
				map = {
					version: 3,
					sections: [ { offset: { line: 1, column: 0 }, map } ],
				};
				compiled.code = `// Concatenated input\n${ compiled.code }`;
			}
			await writeFile(
				join( sourceDirectory, 'maps/compiled.js.map' ),
				JSON.stringify( map )
			);
			directive = 'maps/compiled.js.map';
		} else {
			directive =
				encoding === 'base64'
					? `data:application/json;base64,${ Buffer.from( compiled.map ).toString( 'base64' ) }`
					: `data:application/json,${ encodeURIComponent( compiled.map ) }`;
		}
		const filename = join( sourceDirectory, 'compiled.js' );
		// A later directive-shaped template must not replace the real comment.
		await writeFile(
			filename,
			`${ compiled.code }\n//# sourceMappingURL=${ directive }\nexport const text = \`\n//# sourceMappingURL=missing.map\n\`;`
		);
		const result = await bundle( 'esbuild', filename );
		const consumer = new SourceMapConsumer( JSON.parse( result.map ) );
		const original = consumer.originalPositionFor(
			positionOf( result.code, 'throw new Error' )
		);
		expect( original ).toMatchObject(
			positionOf( source, 'throw new Error' )
		);
		expect(
			new URL(
				original.source!,
				pathToFileURL( join( directory, 'bundle.js' ) )
			).href
		).toBe(
			pathToFileURL(
				join(
					sourceDirectory,
					external ? 'src/original.ts' : 'original.ts'
				)
			).href
		);
		expect( consumer.sourceContentFor( original.source! ) ).toBe( source );
	}
);

it.each( [
	[ 'missing.map', 0 ],
	[ 'data:application/json,invalid', 1 ],
] )(
	'continues building when the input source map is %s',
	async ( directive, warningCount ) => {
		const filename = join( directory, 'fixture.js' );
		await writeFile(
			filename,
			`export const gap = "var(--wpds-dimension-gap-sm)";\n//# sourceMappingURL=${ directive }`
		);
		const result = await esbuild( {
			entryPoints: [ filename ],
			write: false,
			sourcemap: 'inline',
			logLevel: 'silent',
			plugins: [ esbuildPlugin ],
		} );
		expect( result.outputFiles![ 0 ].text ).toContain(
			'var(--wpds-dimension-gap-sm, 8px)'
		);
		expect( result.warnings ).toHaveLength( warningCount );
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

it( 'lets a later Vite pre plugin compile syntax the token parser cannot read', async () => {
	const source = 'export const gap: string = "var(--wpds-dimension-gap-sm)";';
	const filename = join( await realpath( directory ), 'fixture.js' );
	await writeFile( filename, source );
	const server = await createServer( {
		configFile: false,
		root: directory,
		logLevel: 'silent',
		plugins: [
			vitePlugin(),
			{
				name: 'compile-typed-javascript',
				enforce: 'pre',
				transform( code, id ) {
					if ( id !== filename ) {
						return null;
					}
					return esbuildTransform( code, {
						loader: 'ts',
						sourcefile: id,
						sourcemap: 'external',
					} );
				},
			},
		],
		server: { middlewareMode: true, watch: null },
	} );
	try {
		const result = await server.transformRequest( '/fixture.js' );
		expect( result?.code ).toContain( 'var(--wpds-dimension-gap-sm)' );
		expect( result?.code ).not.toContain( ': string' );
	} finally {
		await server.close();
	}
} );
