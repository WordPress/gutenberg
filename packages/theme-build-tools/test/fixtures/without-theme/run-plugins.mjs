import { registerHooks } from 'node:module';

// Make `@wordpress/theme` unresolvable, for both `import` and `require()`, as
// if the optional peer dependency were not installed.
registerHooks( {
	resolve( specifier, context, nextResolve ) {
		if ( specifier.startsWith( '@wordpress/theme/' ) ) {
			throw Object.assign(
				new Error( `Cannot find module '${ specifier }'` ),
				{ code: 'MODULE_NOT_FOUND' }
			);
		}
		return nextResolve( specifier, context );
	},
} );

const { default: postcss } = await import( 'postcss' );
const { transform: lightningcssTransform } = await import( 'lightningcss' );
const { default: stylelint } = await import( 'stylelint' );
const { default: postcssPlugin } =
	await import( '../../../postcss-plugins/postcss-ds-token-fallbacks.mjs' );
const { default: lightningcssPlugin } =
	await import( '../../../lightningcss-plugins/lightningcss-ds-token-fallbacks.mjs' );
const { transformDsTokenFallbacks } =
	await import( '../../../js-plugins/transform-ds-token-fallbacks.mjs' );
const { default: unknownTokensPlugin } =
	await import( '../../../stylelint-plugins/no-unknown-ds-tokens.mjs' );

const css = '.a { color: var(--wpds-not-a-token); }';
const { results } = await stylelint.lint( {
	code: css,
	config: {
		plugins: [ unknownTokensPlugin ],
		rules: { 'plugin-wpds/no-unknown-ds-tokens': true },
	},
} );

process.stdout.write(
	JSON.stringify( {
		postcss: (
			await postcss( [ postcssPlugin ] ).process( css, {
				from: undefined,
			} )
		).css,
		lightningcss: lightningcssTransform( {
			filename: 'styles.css',
			code: Buffer.from( css ),
			visitor: lightningcssPlugin,
		} ).code.toString(),
		js: transformDsTokenFallbacks(
			'export const color = "var(--wpds-not-a-token)";',
			'source.js'
		),
		stylelintWarnings: results[ 0 ].warnings,
	} )
);
