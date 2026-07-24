import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	type InlineConfig,
	type PluginOption,
	mergeConfig,
	transformWithEsbuild,
} from 'vite';
import react from '@vitejs/plugin-react';
import type { StorybookConfig } from '@storybook/react-vite';
import dsTokenFallbacks from '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks';
import dsTokenFallbacksJs from '@wordpress/theme/vite-plugins/vite-ds-token-fallbacks';

/**
 * @see https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
 */
function getAbsolutePath( packageName: string ) {
	return path.dirname(
		fileURLToPath( import.meta.resolve( `${ packageName }/package.json` ) )
	);
}

const { NODE_ENV = 'development' } = process.env;

const stories = [
	'./stories/playground/**/*.story.@(jsx|tsx)',
	'./stories/**/*.mdx',
	'./stories/design-system/**/*.story.@(ts|tsx)',
	'../packages/block-editor/src/**/stories/*.story.@(js|jsx|tsx|mdx)',
	'../packages/editor/src/**/stories/*.story.@(js|jsx|tsx|mdx)',
	'../packages/components/src/**/stories/*.story.@(jsx|tsx)',
	'../packages/components/src/**/stories/*.mdx',
	'../packages/icons/src/**/stories/*.story.@(js|tsx|mdx)',
	'./stories/icons/**/*.story.@(ts|tsx)',
	'../packages/dataviews/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/image-cropper/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/media-editor/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/media-fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/theme/src/**/stories/*.mdx',
	'../packages/theme/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/grid/src/**/stories/*.story.@(ts|tsx)',
	'../packages/widget-primitives/src/**/stories/*.mdx',
	'../packages/widget-primitives/src/**/stories/*.story.@(ts|tsx)',
	'../packages/widget-dashboard/src/**/stories/*.mdx',
	'../packages/widget-dashboard/src/**/stories/*.story.@(ts|tsx)',
	'../routes/dashboard/**/stories/*.story.@(ts|tsx)',
	'../packages/ui/src/**/stories/*.mdx',
	'../packages/ui/src/**/stories/*.story.@(ts|tsx)',
	'../packages/admin-ui/src/**/stories/*.story.@(ts|tsx)',
];

const config: StorybookConfig = {
	core: {
		disableTelemetry: true,
	},
	stories,
	staticDirs: [ './static' ],
	addons: [
		{
			name: getAbsolutePath( '@storybook/addon-docs' ),
			options: { configureJSX: true },
		},
		getAbsolutePath( '@storybook/addon-a11y' ),
		import.meta.resolve( './addons/source-link/preset.ts' ),
		getAbsolutePath( 'storybook-addon-tag-badges' ),
		import.meta.resolve( './addons/design-system-theme/preset.ts' ),
	],
	framework: getAbsolutePath( '@storybook/react-vite' ),
	features: {
		componentsManifest: NODE_ENV !== 'development',
		// Server-side React Component Meta extraction shared by Docs,
		// Controls, MCP, and the components manifest.
		// https://github.com/storybookjs/storybook/discussions/35333
		experimentalDocgenServer: true,
	},
	typescript: {
		// Unused while experimentalDocgenServer is on: the React Vite preset
		// skips build-time react-docgen / react-docgen-typescript plugins.
		// Keep this false so flipping the flag off does not silently re-enable
		// the slow Vite docgen path.
		reactDocgen: false,
	},
	viteFinal: async ( viteConfig ) => {
		return mergeConfig( viteConfig, {
			plugins: [
				dsTokenFallbacksJs(),
				react( {
					babel: {
						plugins: [ getAbsolutePath( '@emotion/babel-plugin' ) ],
					},
				} ) as PluginOption,
				{
					name: 'load-js-files-as-jsx',
					async transform( code: string, id: string ) {
						if ( ! id.match( /.*\.js$/ ) ) {
							return null;
						}

						return transformWithEsbuild( code, id, {
							loader: 'jsx',
							jsx: 'automatic',
						} );
					},
				},
				// Stub the vips and wasm-vips packages for Storybook since they use WASM modules that Vite can't handle.
				{
					name: 'stub-vips',
					enforce: 'pre',
					resolveId( id: string ) {
						// Stub @wordpress/vips imports.
						if (
							id === '@wordpress/vips' ||
							id.startsWith( '@wordpress/vips/' )
						) {
							return '\0virtual:vips-stub';
						}
						// Stub wasm-vips imports.
						if (
							id === 'wasm-vips' ||
							id.startsWith( 'wasm-vips/' )
						) {
							return '\0virtual:wasm-vips-stub';
						}
						// Stub WASM file imports.
						if ( id.endsWith( '.wasm' ) ) {
							return '\0virtual:wasm-stub';
						}
						return null;
					},
					load( id: string ) {
						if ( id === '\0virtual:vips-stub' ) {
							// Return a stub module with no-op exports for Storybook.
							return `
								export const setLocation = () => {};
								export const cancelOperations = async () => false;
								export const convertImageFormat = async () => new ArrayBuffer(0);
								export const compressImage = async () => new ArrayBuffer(0);
								export const resizeImage = async () => ({ buffer: new ArrayBuffer(0), width: 0, height: 0, originalWidth: 0, originalHeight: 0 });
								export const rotateImage = async () => ({ buffer: new ArrayBuffer(0), width: 0, height: 0 });
								export const hasTransparency = async () => false;
								export const vipsConvertImageFormat = convertImageFormat;
								export const vipsCompressImage = compressImage;
								export const vipsResizeImage = resizeImage;
								export const vipsRotateImage = rotateImage;
								export const vipsHasTransparency = hasTransparency;
								export const vipsCancelOperations = cancelOperations;
								export const terminateVipsWorker = () => {};
							`;
						}
						if ( id === '\0virtual:wasm-vips-stub' ) {
							// Return a stub for wasm-vips default export.
							return `export default () => Promise.resolve({});`;
						}
						if ( id === '\0virtual:wasm-stub' ) {
							// Return empty string for WASM files.
							return `export default '';`;
						}
						return null;
					},
				},
			],
			build: {
				/**
				 * Use terser with keep_fnames to preserve component names in source code display.
				 * Without this, Vite's esbuild minifier mangles component names (e.g., BoxControl -> J)
				 * which breaks the Storybook docs source code display.
				 * @see https://github.com/storybookjs/storybook/issues/20769
				 */
				minify: NODE_ENV === 'production' ? 'terser' : false,
				terserOptions: {
					keep_fnames: true,
					mangle: {
						keep_fnames: true,
					},
				},
			},
			define: {
				// Ensures that `@wordpress/warning` can properly detect dev mode.
				'globalThis.SCRIPT_DEBUG': JSON.stringify(
					NODE_ENV === 'development'
				),
			},
			css: {
				postcss: {
					// Vite bundles its own PostCSS, creating a deep
					// type incompatibility with the top-level PostCSS.
					plugins: [ dsTokenFallbacks as any ],
				},
			},
			optimizeDeps: {
				esbuildOptions: {
					loader: {
						'.js': 'tsx',
					},
				},
			},
		} satisfies InlineConfig );
	},
};

export default config;
