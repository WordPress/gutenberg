<?php
/**
 * Prints the view config REST schema as JSON.
 *
 * Loads `Gutenberg_REST_View_Config_Controller_7_1` without a WordPress
 * runtime and dumps the result of `get_item_schema()` to stdout, so that
 * documentation can be generated from the controller — the single source of
 * truth for the view config schema.
 *
 * The stubs below are intentionally minimal: they cover only the symbols
 * `get_item_schema()` needs. If the controller starts depending on other
 * WordPress functions or classes at schema-generation time, this script must
 * fail loudly so the missing dependency is stubbed (or reconsidered)
 * explicitly rather than silently faked.
 *
 * Usage: php tools/docs/dump-view-config-schema.php
 *
 * @package gutenberg
 */

if ( PHP_SAPI !== 'cli' ) {
	fwrite( STDERR, 'This script must be run from the command line.' . PHP_EOL );
	exit( 1 );
}

// Surface notices/warnings as errors so missing stubs cannot go unnoticed.
error_reporting( E_ALL );
set_error_handler(
	static function ( $severity, $message, $file, $line ) {
		throw new ErrorException( $message, 0, $severity, $file, $line );
	}
);

if ( ! function_exists( '__' ) ) {
	/**
	 * Stub for the WordPress translation function: returns the text untranslated.
	 *
	 * @param string $text   Text to translate.
	 * @param string $domain Text domain (unused).
	 * @return string The original text.
	 */
	function __( $text, $domain = 'default' ) {
		return $text;
	}
}

if ( ! class_exists( 'WP_REST_Controller' ) ) {
	/**
	 * Stub for the WordPress REST controller base class.
	 *
	 * Provides only the properties and methods `get_item_schema()` relies on.
	 */
	class WP_REST_Controller {
		/**
		 * Route namespace.
		 *
		 * @var string
		 */
		protected $namespace;

		/**
		 * Route base.
		 *
		 * @var string
		 */
		protected $rest_base;

		/**
		 * Cached item schema.
		 *
		 * @var array
		 */
		protected $schema;

		/**
		 * Stub: returns the schema unchanged (no additional fields outside WordPress).
		 *
		 * @param array $schema Item schema.
		 * @return array The unchanged schema.
		 */
		public function add_additional_fields_schema( $schema ) {
			return $schema;
		}
	}
}

try {
	$controller_path = dirname( __DIR__, 2 ) . '/lib/compat/wordpress-7.1/class-gutenberg-rest-view-config-controller-7-1.php';

	if ( ! is_readable( $controller_path ) ) {
		throw new RuntimeException( 'Controller file not found: ' . $controller_path );
	}

	require_once $controller_path;

	$controller = new Gutenberg_REST_View_Config_Controller_7_1();
	$schema     = $controller->get_item_schema();

	$json = json_encode( $schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );

	if ( false === $json ) {
		throw new RuntimeException( 'Failed to encode the schema as JSON: ' . json_last_error_msg() );
	}

	echo $json . PHP_EOL;
} catch ( Throwable $error ) {
	fwrite(
		STDERR,
		'Failed to dump the view config schema: ' . $error->getMessage() . PHP_EOL .
		'If the controller gained a new WordPress dependency, add a minimal stub to ' . __FILE__ . '.' . PHP_EOL
	);
	exit( 1 );
}
