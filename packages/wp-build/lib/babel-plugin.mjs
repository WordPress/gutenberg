/**
 * External dependencies
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { loadOptions, transformAsync } from '@babel/core';

/**
 * Create an esbuild plugin that transforms matching files with Babel.
 *
 * Minimal inline replacement for the abandoned `esbuild-plugin-babel`
 * package. Babel's regular config resolution still applies, so project-level
 * config files are merged with the passed config.
 *
 * @param {Object}                                 options          Plugin options.
 * @param {RegExp}                                 options.filter   Filter for files to transform.
 * @param {import('@babel/core').TransformOptions} [options.config] Babel options merged with resolved config.
 * @return {import('esbuild').Plugin} esbuild plugin.
 */
export function createBabelPlugin( { filter, config = {} } ) {
	return {
		name: 'babel',
		setup( build ) {
			build.onLoad( { filter }, async ( args ) => {
				const contents = await readFile( args.path, 'utf8' );
				/**
				 * @type {import('@babel/core').TransformOptions | null}
				 */
				const babelOptions = loadOptions( {
					...config,
					filename: args.path,
					caller: {
						/*
						 * Keep the replaced plugin's caller name so external
						 * Babel configs keyed on it still match.
						 */
						name: 'esbuild-plugin-babel',
						supportsStaticESM: true,
					},
				} );

				if ( ! babelOptions ) {
					return { contents };
				}

				if ( babelOptions.sourceMaps ) {
					babelOptions.sourceFileName = path.relative(
						process.cwd(),
						args.path
					);
				}

				const result = await transformAsync( contents, babelOptions );

				if ( typeof result?.code !== 'string' ) {
					throw new Error(
						`Babel produced no code for ${ args.path }.`
					);
				}

				return { contents: result.code };
			} );
		},
	};
}
