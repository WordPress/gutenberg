<?php

require_once __DIR__ . '/../parser.php';

$parser = new WP_Block_Parser();

echo wp_json_encode( $parser->parse( file_get_contents( 'php://stdin' ) ) );
