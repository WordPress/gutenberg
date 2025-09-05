/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { join, sep, basename } = require( 'path' );
const { realpathSync } = require( 'fs' );

/**
 * WordPress dependencies
 */
const PhpFilePathsPlugin = require( '@wordpress/scripts/plugins/php-file-paths-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins, stylesTransform } = require( './shared' );

/**
 * We need to automatically rename some functions when they are called inside block files,
 * but have been declared elsewhere. This way we can call Gutenberg override functions, but
 * the block will still call the core function when updates are back ported.
 */
const prefixFunctions = [
	'wp_apply_colors_support',
	'wp_enqueue_block_support_styles',
	'wp_get_typography_font_size_value',
	'wp_style_engine_get_styles',
	'wp_get_global_settings',
];

const classesToSuffix = [ 'WP_Navigation_Block_Renderer' ];

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

module.exports = [
	{
		...baseConfig,
		name: 'blocks',
		entry: {},
		output: {
			path: join( __dirname, '..', '..' ),
		},
		plugins: [
			...plugins,
			new PhpFilePathsPlugin( {
				context: './packages/block-library/src/',
				props: [ 'render', 'variations' ],
			} ),
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
							from: `${ from }/**/*.php`,
							to( { absoluteFilename } ) {
								const [ , dirname, fileBasename ] =
									absoluteFilename.match(
										new RegExp(
											`([\\w-]+)${ escapeRegExp(
												sep
											) }([\\w-]+)\\.php$`
										)
									);
								if ( fileBasename === 'index' ) {
									return join( to, `${ dirname }.php` );
								}
								return join(
									to,
									dirname,
									`${ fileBasename }.php`
								);
							},
							filter: ( filepath ) => {
								return (
									basename( filepath ) === 'index.php' ||
									PhpFilePathsPlugin.paths.includes(
										realpathSync( filepath ).replace(
											/\\/g,
											'/'
										)
									)
								);
							},
							transform: ( content ) => {
								const prefix = 'gutenberg_';
								const classSuffix = 'Gutenberg';
								content = content.toString();

								// Within content, search and prefix any function calls from the
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

								// Within content, search and prefix any classes calls from the
								// `classesToSuffix` list. This is needed because some classes
								// are called inside block files, but also exist in core.
								// With the rename we can use the Gutenberg class in the plugin,
								// without having to worry about duplicate class names with core.
								content = content.replace(
									new RegExp(
										classesToSuffix.join( '|' ),
										'g'
									),
									( match ) => `${ match }_${ classSuffix }`
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
														functionName +
															'(?![a-zA-Z0-9_])',
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
