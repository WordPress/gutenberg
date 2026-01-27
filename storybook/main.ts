import { type InlineConfig, mergeConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import type { StorybookConfig } from '@storybook/react-vite';

const { NODE_ENV = 'development' } = process.env;

const stories = [
	// Smoke tests ensure that the stories are rendered without any errors, but
	// we don't need to test everything:
	// - `.mdx` documentation is generally plain text and unlikely to break.
	// - Playground stories are complex renderings of many components, which is
	//   both slow and redundant with individual component stories.
	NODE_ENV === 'test' ? '' : './stories/playground/**/*.story.@(jsx|tsx)',
	NODE_ENV === 'test' ? '' : './stories/**/*.mdx',
	'../packages/block-editor/src/**/stories/*.story.@(js|jsx|tsx|mdx)',
	'../packages/components/src/**/stories/*.story.@(jsx|tsx)',
	'../packages/components/src/**/stories/*.mdx',
	'../packages/icons/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/dataviews/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/image-cropper/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/media-fields/src/**/stories/*.story.@(js|tsx|mdx)',
	'../packages/theme/src/**/stories/*.mdx',
	'../packages/theme/src/**/stories/*.story.@(tsx|mdx)',
	'../packages/ui/src/**/stories/*.mdx',
	'../packages/ui/src/**/stories/*.story.@(ts|tsx)',
].filter( Boolean );

export default {
	core: {
		disableTelemetry: true,
	},
	stories,
	staticDirs: [ './static' ],
	addons: [
		{
			name: '@storybook/addon-docs',
			options: { configureJSX: true },
		},
		'@storybook/addon-a11y',
		import.meta.resolve( './addons/source-link/preset.ts' ),
		'storybook-addon-tag-badges',
		import.meta.resolve( './addons/design-system-theme/preset.ts' ),
	],
	framework: '@storybook/react-vite',
	features: {
		experimentalComponentsManifest: NODE_ENV === 'production',
	},
	typescript: {
		reactDocgen: 'react-docgen-typescript',
		// Should match defaults in Storybook except for the propFilter.
		// https://github.com/storybookjs/storybook/blob/3e34a288c8fabc7d5b5cc43b28ae9d674c48e3ea/code/core/src/core-server/presets/common-preset.ts#L162-L168
		reactDocgenTypescriptOptions: {
			EXPERIMENTAL_useProjectService: true,
			shouldExtractLiteralValuesFromEnum: true,
			shouldRemoveUndefinedFromOptional: true,
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
	viteFinal: async ( config ) => {
		return mergeConfig( config, {
			plugins: [
				react( {
					jsxImportSource: '@emotion/react',
					babel: {
						plugins: [ '@emotion/babel-plugin' ],
					},
				} ),
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
			optimizeDeps: {
				esbuildOptions: {
					loader: {
						'.js': 'tsx',
					},
				},
			},
		} satisfies InlineConfig );
	},
} satisfies StorybookConfig;
