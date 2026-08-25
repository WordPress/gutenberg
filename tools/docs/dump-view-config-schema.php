<?php
/**
 * Prints the view config REST schema as JSON.
 *
 * Loads `lib/compat/wordpress-7.1/view-config-schema.php` — the canonical
 * schema, also consumed by the REST controller — without a WordPress runtime
 * and dumps it to stdout, so that documentation can be generated from it.
 *
 * The schema file must stay loadable outside WordPress: the only WordPress
 * function it may use is `__()`, stubbed below to return the text
 * untranslated. If the schema file starts depending on other WordPress
 * functions or classes, this script must fail loudly so the new dependency is
 * reconsidered explicitly rather than silently faked.
 *
 * Usage: php tools/docs/dump-view-config-schema.php
 *
 * @package gutenberg
 */

if ( PHP_SAPI !== 'cli' ) {
	fwrite( STDERR, 'This script must be run from the command line.' . PHP_EOL );
	exit( 1 );
}

// Surface notices/warnings as errors so new WordPress dependencies cannot go unnoticed.
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

try {
	$schema_path = dirname( __DIR__, 2 ) . '/lib/compat/wordpress-7.1/view-config-schema.php';

	if ( ! is_readable( $schema_path ) ) {
		throw new RuntimeException( 'Schema file not found: ' . $schema_path );
	}

	$schema = require $schema_path;

	if ( ! is_array( $schema ) ) {
		throw new RuntimeException( 'Expected the schema file to return an array, got ' . gettype( $schema ) . '.' );
	}

	$json = json_encode( $schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );

	if ( false === $json ) {
		throw new RuntimeException( 'Failed to encode the schema as JSON: ' . json_last_error_msg() );
	}

	echo $json . PHP_EOL;
} catch ( Throwable $error ) {
	fwrite(
		STDERR,
		'Failed to dump the view config schema: ' . $error->getMessage() . PHP_EOL .
		'The schema file must stay loadable outside WordPress — no WordPress API other than `__()`.' . PHP_EOL
	);
	exit( 1 );
}
