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
<script defer src="https://unpkg.com/es-module-shims@0.12.5/dist/es-module-shims.js"></script>
<script type="importmap-shim">
{
	"imports": ' . json_encode( $import_map_entries ) . '
}
</script>
	';
}

add_action( 'admin_enqueue_scripts', 'gutenberg_inject_import_map' );

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
