<?php
/**
 * PHP Test Helper
 *
 * Facilitates running PHP parser against same tests as the JS parser implementation.
 *
 * @package gutenberg
 */

// Include the default parser.
require_once __DIR__ . '/../parser.php';

$parser = new WP_Block_Parser();

echo json_encode( $parser->parse( file_get_contents( 'php://stdin' ) ) );
