<?php
/**
 * Add import map support.
 *
 * @package gutenberg
 */

$import_map_entries = array();

/**
 * Registers an import map entry.
 *
 * @since 5.6.0
 *
 * @global array $import_map_entries The registered import map entries.
 *
 * @param string $key   Import map item key.
 * @param string $value Import map item value.
 */
function gutenberg_register_import_map_entry( $key, $value ) {
	global $import_map_entries;

	$import_map_entries[ $key ] = $value;
}

/**
 * Injects the import map to admin pages.
 */
function gutenberg_inject_import_map() {
	global $import_map_entries;

	if ( empty( $import_map_entries ) ) {
		return;
	}

	echo '
<script type="importmap">
{
	"imports": ' . json_encode( $import_map_entries ) . '
}
</script>
	';
}

add_action( 'admin_enqueue_scripts', 'gutenberg_inject_import_map' );

gutenberg_register_import_map_entry( 'lodash', 'https://cdn.skypack.dev/lodash' );
gutenberg_register_import_map_entry( 'react', 'https://cdn.skypack.dev/react@17.0.1' );
gutenberg_register_import_map_entry( 'react-dom', 'https://cdn.skypack.dev/react-dom@17.0.1' );
gutenberg_register_import_map_entry( 'moment', 'https://cdn.skypack.dev/moment/moment' );
gutenberg_register_import_map_entry( 'moment-timezone/moment-timezone', 'https://cdn.skypack.dev/moment-timezone/moment-timezone' );
gutenberg_register_import_map_entry( 'moment-timezone/moment-timezone-utils', 'https://cdn.skypack.dev/moment-timezone/moment-timezone-utils' );

/**
 * Convert string to in camel-case, useful for class name patterns.
 *
 * @param string $string Target string.
 *
 * @return string Camel-case string.
 */
function gutenberg_to_camel_case( $string ) {
	$string = str_replace( '-', ' ', $string );
	$string = str_replace( '_', ' ', $string );
	$string = lcfirst( ucwords( strtolower( $string ) ) );
	$string = str_replace( ' ', '', $string );
	return $string;
}

foreach ( glob( gutenberg_dir_path() . 'build/esm/*.js' ) as $path ) {
	$package_name = substr( basename( $path ), 0, -3 );
	gutenberg_register_import_map_entry( '@wordpress/' . $package_name, plugins_url( 'build/esm', __DIR__ ) . '/' . $package_name . '.js' );
}

/**
 * Hichjack the scripts initialization to use the esmodules instead.
 *
 * @param string $tag    The `<script>` tag for the enqueued script.
 * @param string $handle The script's registered handle.
 * @param string $src    The script's source URL.
 *
 * @return string Updated tag.
 */
function gutenberg_inject_module_scripts( $tag, $handle, $src ) {
	$packages = array();
	foreach ( glob( gutenberg_dir_path() . 'build/esm/*.js' ) as $path ) {
		$package_name = substr( basename( $path ), 0, -3 );
		$packages[]   = 'wp-' . $package_name;
	}
	$vendors                 = array( 'lodash', 'react', 'react-dom', 'moment', 'moment-timezone' );
	$export_default_packages = array(
		'api-fetch',
		'deprecated',
		'dom-ready',
		'redux-routine',
		'token-list',
		'server-side-render',
		'shortcode',
		'warning',
	);

	if ( in_array( $handle, $packages, true ) ) {
		$package_name = substr( $handle, 3 );
		$import       = in_array( $package_name, $export_default_packages, true ) ? 'mod' : '* as mod';
		// Replace all scripts with a module script to defer them.
		$tag = str_replace( '<script ', '<script type="module" ', $tag );

		// Replace the content script with an esmodule import.
		$tag          = str_replace(
			sprintf( "<script type=\"module\" src='%s' id='%s-js'></script>", $src, esc_attr( $handle ) ),
			sprintf(
				'<script id="script-%s" type="module">import %s from "@wordpress/%s"; window.wp = window.wp || {}; window.wp.%s = mod;</script>',
				$package_name,
				$import,
				$package_name,
				gutenberg_to_camel_case( $package_name )
			),
			$tag
		);
	} elseif ( in_array( $handle, $vendors, true ) ) {
		$tag = sprintf(
			'<script id="script-%s" type="module">import * as mod from "%s"; window.%s = mod;</script>',
			$handle,
			$handle,
			gutenberg_to_camel_case( $handle )
		);
	} elseif ( false === strpos( $handle, 'thickbox' ) && false === strpos( $handle, 'tinymce' ) && false === strpos( $handle, 'clipboard' ) && false === strpos( $handle, 'jquery' ) && false === strpos( $handle, 'hoverintent' ) && false === strpos( $handle, 'moxie' ) ) {
		$tag = str_replace( '<script ', '<script type="module" ', $tag );
	}

	return $tag;
}

add_filter( 'script_loader_tag', 'gutenberg_inject_module_scripts', 10, 3 );
