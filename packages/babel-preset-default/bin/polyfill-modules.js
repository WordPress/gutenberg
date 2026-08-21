const compat = require( 'core-js-compat/compat' );
const exclusions = require( '../polyfill-exclusions' );

/**
 * Lists the `core-js` modules the polyfill bundle needs for the browsers in
 * `@wordpress/browserslist-config`, in bundle order.
 *
 * The list is limited to the modules shipped by the installed `core-js`, so a
 * newer `core-js-compat` cannot select a module that does not exist yet.
 *
 * @return {{ list: string[], targets: Record< string, Record< string, string > > }}
 *         Module names and, per module, the targets that still need it.
 */
function getPolyfillModules() {
	return compat( {
		modules: [ 'es.', 'web.' ],
		exclude: exclusions,
		targets: require( '@wordpress/browserslist-config' ),
		version: require( 'core-js/package.json' ).version,
	} );
}

module.exports = { getPolyfillModules };
