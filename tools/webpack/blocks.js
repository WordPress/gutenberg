/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { join, sep } = require( 'path' );
const fastGlob = require( 'fast-glob' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins, stylesTransform } = require( './shared' );

/*
 * Matches a block's filepaths in the form build-module/<filename>.js
 */
const blockViewRegex = new RegExp(
	/build-module\/(?<filename>.*\/view.*).js$/
);

/**
 * We need to automatically rename some functions when they are called inside block files,
 * but have been declared elsewhere. This way we can call Gutenberg override functions, but
 * the block will still call the core function when updates are back ported.
 */
const prefixFunctions = [
	'build_query_vars_from_query_block',
	'wp_apply_colors_support',
	'wp_enqueue_block_support_styles',
	'wp_get_typography_font_size_value',
	'wp_style_engine_get_styles',
];

/**
 * Escapes the RegExp special characters.
 *
 * @param {string} string Input string.
 *
 * @return {string} Regex-escaped string.
 */
function escapeRegExp( string ) {
	return string.replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' );
}

const createEntrypoints = () => {
	/*
	 * Returns an array of paths to block view files within the `@wordpress/block-library` package.
	 * These paths can be matched by the regex `blockViewRegex` in order to extract
	 * the block's filename.
	 *
	 * Returns an empty array if no files were found.
	 */
	const blockViewScriptPaths = fastGlob.sync(
		'./packages/block-library/build-module/**/view*.js'
	);

	/*
	 * Go through the paths found above, in order to define webpack entry points for
	 * each block's view.js file.
	 */
	return blockViewScriptPaths.reduce( ( entries, scriptPath ) => {
		const result = scriptPath.match( blockViewRegex );
		if ( ! result?.groups?.filename ) {
			return entries;
		}

		return {
			...entries,
			[ result.groups.filename ]: scriptPath,
		};
	}, {} );
};

module.exports = [
	{
		...baseConfig,
		name: 'blocks',
		entry: createEntrypoints(),
		output: {
			devtoolNamespace: 'wp',
			filename: './build/block-library/blocks/[name].min.js',
			path: join( __dirname, '..', '..' ),
		},
		plugins: [
			...plugins,
			new DependencyExtractionWebpackPlugin( { injectPolyfill: false } ),
			new CopyWebpackPlugin( {
				patterns: [].concat(
					[
						'style',
						'style-rtl',
						'editor',
						'editor-rtl',
						'theme',
						'theme-rtl',
					].map( ( filename ) => ( {
						from: `./packages/block-library/build-style/*/${ filename }.css`,
						to( { absoluteFilename } ) {
							const [ , dirname ] = absoluteFilename.match(
								new RegExp(
									`([\\w-]+)${ escapeRegExp(
										sep
									) }${ filename }\\.css$`
								)
							);

							return join(
								'build/block-library/blocks',
								dirname,
								filename + '.css'
							);
						},
						transform: stylesTransform,
					} ) ),
					Object.entries( {
						'./packages/block-library/src/':
							'build/block-library/blocks/',
						'./packages/edit-widgets/src/blocks/':
							'build/edit-widgets/blocks/',
						'./packages/widgets/src/blocks/':
							'build/widgets/blocks/',
					} ).flatMap( ( [ from, to ] ) => [
						{
							from: `${ from }/**/index.php`,
							to( { absoluteFilename } ) {
								const [ , dirname ] = absoluteFilename.match(
									new RegExp(
										`([\\w-]+)${ escapeRegExp(
											sep
										) }index\\.php$`
									)
								);

								return join( to, `${ dirname }.php` );
							},
							transform: ( content ) => {
								const prefix = 'gutenberg_';
								content = content.toString();

								// Within content, search and prefix any function calls from
								// `prefixFunctions` list. This is needed because some functions
								// are called inside block files, but have been declared elsewhere.
								// So with the rename we can call Gutenberg override functions, but the
								// block will still call the core function when updates are back ported.
								content = content.replace(
									new RegExp(
										prefixFunctions.join( '|' ),
										'g'
									),
									( match ) =>
										`${ prefix }${ match.replace(
											/^wp_/,
											''
										) }`
								);

								// Within content, search for any function definitions. For
								// each, replace every other reference to it in the file.
								return (
									Array.from(
										content.matchAll(
											/^\s*function ([^\(]+)/gm
										)
									)
										.reduce(
											( result, [ , functionName ] ) => {
												// Prepend the Gutenberg prefix, substituting any
												// other core prefix (e.g. "wp_").
												return result.replace(
													new RegExp(
														functionName,
														'g'
													),
													( match ) =>
														prefix +
														match.replace(
															/^wp_/,
															''
														)
												);
											},
											content
										)
										// The core blocks override procedure takes place in
										// the init action default priority to ensure that core
										// blocks would have been registered already. Since the
										// blocks implementations occur at the default priority
										// and due to WordPress hooks behavior not considering
										// mutations to the same priority during another's
										// callback, the Gutenberg build blocks are modified
										// to occur at a later priority.
										.replace(
											/(add_action\(\s*'init',\s*'gutenberg_register_block_[^']+'(?!,))/,
											'$1, 20'
										)
								);
							},
							noErrorOnMissing: true,
						},
						{
							from: `${ from }/*/block.json`,
							to( { absoluteFilename } ) {
								const [ , dirname ] = absoluteFilename.match(
									new RegExp(
										`([\\w-]+)${ escapeRegExp(
											sep
										) }block\\.json$`
									)
								);

								return join( to, dirname, 'block.json' );
							},
						},
					] )
				),
			} ),
		].filter( Boolean ),
	},
];
