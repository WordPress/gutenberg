import { mergeConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import type { StorybookConfig } from '@storybook/react-vite';

const stories = [
	process.env.NODE_ENV !== 'test' ? './stories/**/*.story.@(jsx|tsx)' : '',
	process.env.NODE_ENV !== 'test' ? './stories/**/*.mdx' : '',
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
	docs: {},
	typescript: {
		reactDocgen: 'react-docgen-typescript',
		// Should match defaults in Storybook except for the propFilter.
		// https://github.com/storybookjs/storybook/blob/3e34a288c8fabc7d5b5cc43b28ae9d674c48e3ea/code/core/src/core-server/presets/common-preset.ts#L162-L168
		reactDocgenTypescriptOptions: {
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
			define: {
				// Ensures that `@wordpress/warning` can properly detect dev mode.
				'globalThis.SCRIPT_DEBUG': JSON.stringify(
					process.env.NODE_ENV === 'development'
				),
			},
			optimizeDeps: {
				esbuildOptions: {
					loader: {
						'.js': 'tsx',
					},
				},
			},
		} );
	},
} satisfies StorybookConfig;
