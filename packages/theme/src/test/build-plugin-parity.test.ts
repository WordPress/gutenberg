import { readFile } from 'fs/promises';
import { join } from 'path';
import type {
	OnLoadArgs,
	OnLoadOptions,
	OnLoadResult,
	PluginBuild,
} from 'esbuild';
import postcss from 'postcss';

import esbuildPlugin from '../esbuild-plugins/esbuild-ds-token-fallbacks.mjs';
import postcssPlugin from '../postcss-plugins/postcss-ds-token-fallbacks.mjs';
import vitePlugin from '../vite-plugins/vite-ds-token-fallbacks.mjs';

const fixturesDirectory = join( __dirname, 'fixtures/build-plugins' );
const validJsFixture = join( fixturesDirectory, 'source.ts' );
const unknownJsFixture = join( fixturesDirectory, 'unknown-token.ts' );

type EsbuildOnLoad = (
	args: OnLoadArgs
) =>
	| OnLoadResult
	| Promise< OnLoadResult | null | undefined >
	| null
	| undefined;

type ViteTransform = (
	code: string,
	id: string
) => { code: string; map: null } | null;

function getEsbuildHook(): {
	options: OnLoadOptions;
	transform: EsbuildOnLoad;
} {
	let options: OnLoadOptions | undefined;
	let transform: EsbuildOnLoad | undefined;

	esbuildPlugin.setup( {
		onLoad: ( onLoadOptions, callback ) => {
			options = onLoadOptions;
			transform = callback;
		},
	} as Pick< PluginBuild, 'onLoad' > as PluginBuild );

	if ( ! options || ! transform ) {
		throw new Error( 'Expected the esbuild plugin to register onLoad.' );
	}

	return { options, transform };
}

function getViteTransform(): ViteTransform {
	const transform = vitePlugin().transform;

	if ( typeof transform !== 'function' ) {
		throw new Error( 'Expected the Vite plugin to register transform.' );
	}

	return transform as ViteTransform;
}

describe( 'design token fallback build plugin parity', () => {
	it.each( [ 'styles.css', 'styles.module.css' ] )(
		'transforms supported CSS in %s',
		async ( fixture ) => {
			const filename = join( fixturesDirectory, fixture );
			const source = await readFile( filename, 'utf8' );
			const result = await postcss( [ postcssPlugin ] ).process( source, {
				from: filename,
			} );

			expect( result.css ).toMatchSnapshot();
		}
	);

	it( 'keeps esbuild and Vite source-text transforms aligned', async () => {
		const source = await readFile( validJsFixture, 'utf8' );
		const esbuildResult = await getEsbuildHook().transform( {
			path: validJsFixture,
		} as OnLoadArgs );
		const viteResult = getViteTransform()( source, validJsFixture );

		expect( esbuildResult?.loader ).toBe( 'tsx' );
		expect( esbuildResult?.contents ).toBe( viteResult?.code );
		expect( viteResult?.code ).toMatchSnapshot();
	} );

	it.each( [ '.js', '.jsx', '.ts', '.tsx', '.mjs', '.mts', '.cjs', '.cts' ] )(
		'transforms the documented JavaScript and TypeScript %s extension',
		async ( extension ) => {
			const source = await readFile( validJsFixture, 'utf8' );
			const { options } = getEsbuildHook();

			expect( options.filter.test( `fixture${ extension }` ) ).toBe(
				true
			);
			expect(
				getViteTransform()( source, `fixture${ extension }` )
			).not.toBeNull();
		}
	);

	it( 'skips unsupported JS plugin inputs', async () => {
		const source = await readFile( validJsFixture, 'utf8' );
		const { options, transform } = getEsbuildHook();

		expect( options.filter.test( 'fixture.css' ) ).toBe( false );
		expect( getViteTransform()( source, 'fixture.css' ) ).toBeNull();
		await expect(
			transform( {
				path: '/project/node_modules/package/fixture.ts',
			} as OnLoadArgs )
		).resolves.toBeUndefined();
		expect(
			getViteTransform()(
				source,
				'/project/node_modules/package/fixture.ts'
			)
		).toBeNull();
	} );

	it( 'fails consistently for unknown tokens in transformed content', async () => {
		const unknownCssFixture = join(
			fixturesDirectory,
			'unknown-token.css'
		);
		const cssSource = await readFile( unknownCssFixture, 'utf8' );
		const jsSource = await readFile( unknownJsFixture, 'utf8' );

		await expect(
			postcss( [ postcssPlugin ] ).process( cssSource, {
				from: unknownCssFixture,
			} )
		).rejects.toThrow( 'Unknown design token: --wpds-not-a-token' );
		await expect(
			getEsbuildHook().transform( {
				path: unknownJsFixture,
			} as OnLoadArgs )
		).rejects.toThrow( 'Unknown design token: --wpds-not-a-token' );
		expect( () =>
			getViteTransform()( jsSource, unknownJsFixture )
		).toThrow( 'Unknown design token: --wpds-not-a-token' );
	} );
} );
