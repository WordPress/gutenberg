<?php
/**
 * PHP Test Helper
 *
 * Facilitates running Core's PHP parser against the same tests as the JS parser implementation.
 *
 * @package gutenberg
 */

// Load Core's parser from the wordpress-develop checkout whose PHPUnit tests are in WP_TESTS_DIR.
$wp_includes = dirname( getenv( 'WP_TESTS_DIR' ), 2 ) . '/src/wp-includes';

require_once $wp_includes . '/html-api/class-wp-html-span.php';
require_once $wp_includes . '/class-wp-block-processor.php';
require_once $wp_includes . '/class-wp-block-parser.php';

$parser = new WP_Block_Parser();

echo json_encode( $parser->parse( file_get_contents( 'php://stdin' ) ) );
