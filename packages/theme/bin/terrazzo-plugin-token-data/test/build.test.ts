import { readFile } from 'node:fs/promises';
import { build, defineConfig, parse } from '@terrazzo/parser';
import pluginCSS from '@terrazzo/plugin-css';
import { describe, expect, it } from 'vitest';
import inlineAliasValues from '../../terrazzo-plugin-inline-alias-values/index.ts';
import pluginTokenData from '../index.ts';

const colorSource = new URL( '../../../tokens/color.json', import.meta.url );

describe( 'token fallback generation', () => {
	it( 'uses current aliases for new and repointed token fallbacks', async () => {
		const source = JSON.parse( await readFile( colorSource, 'utf8' ) );
		source[ 'wpds-color' ].background.surface[ 'audit-brand-alias' ] = {
			$value: '{wpds-color.primitive.primary.bgFill1}',
		};
		source[ 'wpds-color' ].background.interactive[ 'brand-strong' ].$value =
			'{wpds-color.primitive.bg.surface1}';

		const config = defineConfig(
			{
				lint: { rules: { 'core/consistent-naming': [ 'off', {} ] } },
				plugins: [
					inlineAliasValues( {
						pattern: /^wpds-color\.primitive\./,
					} ),
					pluginCSS( { legacyHex: true } ),
					pluginTokenData(),
				],
			},
			{ cwd: new URL( '../../../', import.meta.url ) }
		);
		const { tokens, sources, resolver } = await parse(
			[ { filename: colorSource, src: JSON.stringify( source ) } ],
			{ config }
		);
		const { outputFiles } = await build( tokens, {
			sources,
			resolver,
			config,
		} );
		const fallbackFile = outputFiles.find(
			( file ) => file.filename === 'js/design-token-fallbacks.mjs'
		)!;
		const { default: fallbacks } = await import(
			/* @vite-ignore */
			`data:text/javascript;base64,${ Buffer.from( String( fallbackFile.contents ) ).toString( 'base64' ) }`
		);

		expect(
			fallbacks[ '--wpds-color-background-surface-audit-brand-alias' ]
		).toBe( 'var(--wp-admin-theme-color, #3858e9)' );
		expect(
			fallbacks[ '--wpds-color-background-interactive-brand-strong' ]
		).toBe( '#f3f3f3' );
	} );
} );
