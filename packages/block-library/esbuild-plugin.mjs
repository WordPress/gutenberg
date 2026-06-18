/**
 * External dependencies
 */
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Creates an ESBuild plugin that replaces experimental block imports with
 * empty module stubs when building for WordPress core (IS_GUTENBERG_PLUGIN = false).
 *
 * For example, given this source in index.js:
 *     import * as experimentalBlock from "./experimental-block";
 *
 * When building without IS_GUTENBERG_PLUGIN, the plugin intercepts the import
 * and returns an empty module, which allows ESBuild's tree shaking to eliminate
 * the experimental block code from the bundle.
 *
 * For more context, see https://github.com/WordPress/gutenberg/issues/79203
 * and the original Babel plugin at https://github.com/WordPress/gutenberg/pull/40655
 *
 * @param {Object}  options
 * @param {string}  options.packageDir        Absolute path to the package directory.
 * @param {boolean} options.isGutenbergPlugin Whether building for the Gutenberg plugin.
 * @return {import('esbuild').Plugin} ESBuild plugin.
 */
export default function createExperimentalBlocksPlugin( {
	packageDir,
	isGutenbergPlugin,
} ) {
	return {
		name: 'experimental-blocks',
		setup( build ) {
			if ( isGutenbergPlugin ) {
				return;
			}

			const srcIndexJs = path.join( packageDir, 'src', 'index.js' );
			const srcDir = path.join( packageDir, 'src' );

			// Intercept single-level relative imports (e.g. `./accordion`) from
			// the block-library index entry point only.
			build.onResolve( { filter: /^\.\/[^/]+$/ }, async ( args ) => {
				if ( args.importer !== srcIndexJs ) {
					return null;
				}

				const blockJsonPath = path.join(
					srcDir,
					args.path,
					'block.json'
				);

				let blockJson;
				try {
					blockJson = JSON.parse(
						await readFile( blockJsonPath, 'utf8' )
					);
				} catch {
					// Not a block directory or no block.json — skip.
					return null;
				}

				if (
					blockJson &&
					'__experimental' in blockJson &&
					blockJson.__experimental !== false
				) {
					return {
						path: args.path,
						namespace: 'experimental-block-stub',
					};
				}

				return null;
			} );

			// Return an empty module for experimental blocks.
			build.onLoad(
				{ filter: /.*/, namespace: 'experimental-block-stub' },
				() => ( {
					contents: '',
					loader: 'js',
				} )
			);
		},
	};
}
