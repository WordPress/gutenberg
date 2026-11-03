// Load every plugin entrypoint with `require()`, as a CommonJS configuration
// file would, and run the PostCSS plugin.
const postcss = require( 'postcss' );

const entrypoints = [
	'../../../postcss-plugins/postcss-ds-token-fallbacks.mjs',
	'../../../lightningcss-plugins/lightningcss-ds-token-fallbacks.mjs',
	'../../../esbuild-plugins/esbuild-ds-token-fallbacks.mjs',
	'../../../vite-plugins/vite-ds-token-fallbacks.mjs',
	'../../../stylelint-plugins/no-unknown-ds-tokens.mjs',
	'../../../stylelint-plugins/no-setting-wpds-custom-properties.mjs',
	'../../../stylelint-plugins/no-token-fallback-values.mjs',
];

const loaded = entrypoints.map( ( entrypoint ) =>
	Boolean( require( entrypoint ).default )
);

const { default: postcssPlugin } = require( entrypoints[ 0 ] );
const { css } = postcss( [ postcssPlugin ] ).process(
	'.a { gap: var(--wpds-dimension-gap-sm); }',
	{ from: undefined }
);

process.stdout.write( JSON.stringify( { loaded, css } ) );
