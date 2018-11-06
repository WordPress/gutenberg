<?php

require_once __DIR__ . '/../../../lib/parser.php';

$parser = new Gutenberg_PEG_Parser();

echo json_encode( $parser->parse( file_get_contents( 'php://stdin' ) ) );
