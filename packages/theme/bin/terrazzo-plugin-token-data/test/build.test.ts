import { readFile } from 'node:fs/promises';
import { build, defineConfig, parse } from '@terrazzo/parser';
import pluginCSS from '@terrazzo/plugin-css';
import { describe, expect, it } from 'vitest';
import inlineAliasValues from '../../terrazzo-plugin-inline-alias-values/index.ts';
import pluginTokenData from '../index.ts';

const colorSource = new URL( '../../../tokens/color.json', import.meta.url );
const brandFallback = 'var(--wp-admin-theme-color, #3858e9)';

function createConfig() {
	return defineConfig(
		{
			lint: { rules: { 'core/consistent-naming': [ 'off', {} ] } },
			plugins: [
				inlineAliasValues( { pattern: /^wpds-color\.primitive\./ } ),
				pluginCSS( { legacyHex: true } ),
				pluginTokenData( {
					additionalScssFilenames: [ 'additional-fallbacks.scss' ],
				} ),
			],
		},
		{ cwd: new URL( '../../../', import.meta.url ) }
	);
}

async function buildTokens( source: string, config = createConfig() ) {
	const { tokens, sources, resolver } = await parse(
		[ { filename: colorSource, src: source } ],
		{ config }
	);
	const { outputFiles } = await build( tokens, {
		sources,
		resolver,
		config,
	} );
	return Object.fromEntries(
		outputFiles.map( ( file ) => [
			file.filename,
			String( file.contents ),
		] )
	);
}

async function expectFallback(
	files: Awaited< ReturnType< typeof buildTokens > >,
	token: string,
	fallback: string
) {
	// Read both JavaScript outputs as consumers do, rather than matching JSON text.
	const { tokens } = await import(
		/* @vite-ignore */
		`data:text/javascript;base64,${ Buffer.from( files[ 'js/design-tokens.mjs' ] ).toString( 'base64' ) }`
	);
	const { default: fallbacks } = await import(
		/* @vite-ignore */
		`data:text/javascript;base64,${ Buffer.from( files[ 'js/design-token-fallbacks.mjs' ] ).toString( 'base64' ) }`
	);
	expect( tokens[ token ].fallback ).toBe( fallback );
	expect( fallbacks[ token ] ).toBe( fallback );
	for ( const filename of [
		'scss/design-token-fallbacks.scss',
		'additional-fallbacks.scss',
	] ) {
		expect( files[ filename ] ).toContain(
			`'${ token }': '${ fallback }'`
		);
	}
}

describe( 'token fallback generation', () => {
	it( 'uses new aliases on the first build and produces identical rebuilds', async () => {
		const source = JSON.parse( await readFile( colorSource, 'utf8' ) );
		source[ 'wpds-color' ].background.surface[ 'audit-brand-alias' ] = {
			$value: '{wpds-color.primitive.primary.bgFill1}',
		};
		const input = JSON.stringify( source );
		const config = createConfig();
		const files = await buildTokens( input, config );
		await expectFallback(
			files,
			'--wpds-color-background-surface-audit-brand-alias',
			brandFallback
		);
		expect( await buildTokens( input, config ) ).toEqual( files );
	} );

	it.each( [
		[ 'neutral', '{wpds-color.primitive.primary.bgFill1}', brandFallback ],
		[ 'brand-strong', '{wpds-color.primitive.bg.surface1}', '#f4f4f4' ],
		[
			'brand-strong-active',
			'{wpds-color.primitive.primary.bgFill1}',
			brandFallback,
		],
	] )(
		'updates fallbacks immediately when repointing %s',
		async ( name, alias, fallback ) => {
			const source = JSON.parse( await readFile( colorSource, 'utf8' ) );
			const config = createConfig();
			await buildTokens( JSON.stringify( source ), config );
			source[ 'wpds-color' ].background.interactive[ name ].$value =
				alias;
			const input = JSON.stringify( source );
			const files = await buildTokens( input, config );
			await expectFallback(
				files,
				`--wpds-color-background-interactive-${ name }`,
				fallback
			);
			expect( await buildTokens( input, config ) ).toEqual( files );
		}
	);
} );
