import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type InlineConfig, type PluginOption, mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { StorybookConfig } from '@storybook/react-vite';
import dsTokenFallbacks from '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks';
import dsTokenFallbacksJs from '@wordpress/theme/vite-plugins/vite-ds-token-fallbacks';
import babel from './vite-babel-plugin.js';

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
	'../packages/block-editor/src/**/stories/*.story.@(jsx|tsx|mdx)',
	'../packages/editor/src/**/stories/*.story.@(jsx|tsx|mdx)',
	'../packages/global-styles-ui/src/**/stories/*.story.@(jsx|tsx|mdx)',
	'../packages/components/src/**/stories/*.story.@(jsx|tsx)',
	'../packages/components/src/**/stories/*.mdx',
	'../packages/icons/src/**/stories/*.story.@(tsx|mdx)',
	'./stories/icons/**/*.story.@(ts|tsx)',
	'../packages/dataviews/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/fields/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/image-cropper/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/media-editor/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/media-fields/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/theme/src/**/stories/*.mdx',
	'../packages/theme/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/grid/src/**/stories/*.story.@(ts|tsx)',
	'../packages/widget-primitives/src/**/stories/*.mdx',
	'../packages/widget-primitives/src/**/stories/*.story.@(ts|tsx)',
	'../packages/widget-dashboard/src/**/stories/*.mdx',
	'../packages/widget-dashboard/src/**/stories/*.story.@(ts|tsx)',
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
	tags: {
		'docs-only': {
			// Keep stories available to attached MDX while hiding their
			// standalone pages from the sidebar.
			excludeFromSidebar: true,
		},
	},
	features: {
		componentsManifest: NODE_ENV !== 'development',
		// Use experimental TypeScript LanguageService prop extractor for the
		// components manifest to improve performance and accuracy.
		//
		// This only applies to the components manifest and not the Storybook
		// UI. Storybook describes this extractor as the "successor" of both
		// `react-docgen` and `react-docgen-typescript`, but it currently only
		// applies to the manifest.
		//
		// See: https://github.com/storybookjs/storybook/issues/34824
		experimentalReactComponentMeta: true,
	},
	typescript: {
		reactDocgen: 'react-docgen-typescript',
		// Should match defaults in Storybook except for the propFilter.
		// https://github.com/storybookjs/storybook/blob/3e34a288c8fabc7d5b5cc43b28ae9d674c48e3ea/code/core/src/core-server/presets/common-preset.ts#L162-L168
		reactDocgenTypescriptOptions: {
			// Use a docgen-specific TypeScript configuration that disables
			// project references. Without this, docgen follows referenced
			// projects' built `.d.ts` declarations and emits a duplicate
			// `__docgenInfo` block per component (one from source, one from the
			// declaration file) that clobbers source-derived descriptions.
			// Separate `tsconfig.json` is used instead of `compilerOptions` to
			// allow the rest of the base `tsconfig.base.json` to be inherited.
			tsconfigPath: path.join(
				import.meta.dirname,
				'tsconfig.docgen.json'
			),
			shouldExtractLiteralValuesFromEnum: true,
			shouldRemoveUndefinedFromOptional: true,
			// Keep JSDoc tags like `@ignore` in prop descriptions so Storybook
			// native docs-tools parser can filter them. The Vite docgen plugin
			// defaults `shouldIncludePropTagMap` to true, splitting tags into
			// a separate object that Storybook does not read for `@ignore`.
			shouldIncludePropTagMap: false,
			// Component names should come from source (displayName or named
			// functions / exports) rather than build-time plugin injection,
			// which can clobber author-defined names unpredictably.
			setDisplayName: false,
			propFilter: ( prop ) => {
				if ( ! prop.parent ) {
					return true;
				}

				if ( /@base-ui|@ariakit/.test( prop.parent.fileName ) ) {
					return true;
				}

				return ! /node_modules/.test( prop.parent.fileName );
			},
			savePropValueAsString: true,
		},
	},
	viteFinal: async ( viteConfig ) => {
		return mergeConfig( viteConfig, {
			plugins: [
				dsTokenFallbacksJs(),
				react() as PluginOption,
				// @rolldown/plugin-babel requires Node 22, but Gutenberg still
				// supports Node 20. Keep the same call shape so this fallback can
				// be replaced with the package after the Node upgrade.
				await babel( {
					generatorOpts: {
						decoratorsBeforeExport: true,
						importAttributesKeyword: 'with',
					},
					overrides: [
						{
							test: /x(?:$|\?)/,
							retainLines: NODE_ENV !== 'production',
						},
					],
					plugins: [ getAbsolutePath( '@emotion/babel-plugin' ) ],
				} ),
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
				// Let the browser discover JavaScript dependencies as it
				// evaluates each module. Preloading the complete dependency
				// graph creates hundreds of concurrent requests on first load.
				modulePreload: false,
				// Storybook's preview includes its shared runtime and all stories.
				// Automatic chunk splitting is already enabled; 3.5 MB leaves a
				// meaningful budget above the current 3.15 MB largest chunk.
				chunkSizeWarningLimit: 3_500,
				/**
				 * Use terser with keep_fnames to preserve component names in source code display.
				 * Without this, Vite's default minifier mangles component names (e.g., BoxControl -> J)
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
				rolldownOptions: {
					checks: {
						// Storybook's legacy `react-docgen` and
						// `react-docgen-typescript` transforms are expected to
						// dominate the build. Keep them enabled without emitting
						// timing warnings.
						pluginTimings: false,
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
					plugins: [
						dsTokenFallbacks as any,
						{
							// `postcss-modules` turns CSS composed from another module into a
							// string before it prepends it to the current stylesheet. Parsing
							// that string discards the declarations' source metadata, which
							// makes Vite warn even when no asset resolution is needed.
							postcssPlugin:
								'supply-composed-css-module-source-fallback',
							OnceExit( root ) {
								root.walkDecls( ( declaration ) => {
									const requiresSourceForAssetResolution =
										/(?:url|image-set)\(/i.test(
											declaration.value
										);

									// The fallback file is unsafe when Vite uses it to resolve assets.
									if (
										! declaration.source?.input.file &&
										! requiresSourceForAssetResolution
									) {
										declaration.source = root.source;
									}
								} );
							},
						},
					],
				},
			},
		} satisfies InlineConfig );
	},
};

export default config;
