/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const postcss = require( 'postcss' );

/**
 * WordPress dependencies
 */
const webpackConfig = require( '@wordpress/build-config' ).webpackConfig;

/**
 * Internal dependencies
 */
const { dependencies } = require( './package' );

const WORDPRESS_NAMESPACE = '@wordpress/';

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * @param {string} string Input dash-delimited string.
 *
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace(
		/-([a-z])/g,
		( match, letter ) => letter.toUpperCase()
	);
}

const gutenbergPackages = Object.keys( dependencies )
	.filter( ( packageName ) => packageName.startsWith( WORDPRESS_NAMESPACE ) )
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

webpackConfig.entry = gutenbergPackages.reduce( ( memo, packageName ) => {
	const name = camelCaseDash( packageName );
	memo[ name ] = `./packages/${ packageName }`;
	return memo;
}, {} );

webpackConfig.plugins.push(
	new CopyWebpackPlugin(
		gutenbergPackages.map( ( packageName ) => ( {
			from: `./packages/${ packageName }/build-style/*.css`,
			to: `./build/${ packageName }/`,
			flatten: true,
			transform: ( content ) => {
				if ( webpackConfig.mode === 'production' ) {
					return postcss( [
						require( 'cssnano' )( {
							preset: [ 'default', {
								discardComments: {
									removeAll: true,
								},
							} ],
						} ),
					] )
						.process( content, { from: 'src/app.css', to: 'dest/app.css' } )
						.then( ( result ) => result.css );
				}
				return content;
			},
		} ) )
	)
);

module.exports = webpackConfig;
