<?php
/**
 * PHP Test Helper
 *
 * Facilitates running PHP parser against same tests as the JS parser implementation.
 *
 * @package gutenberg
 */

// Include the generated parser.
require_once dirname( __FILE__ ) . '/../parser.php';

$parser = new Gutenberg_PEG_Parser();

echo json_encode( $parser->parse( file_get_contents( 'php://stdin' ) ) );
