<?php
/**
 * PHP Test Helper
 *
 * Facilitates running PHP parser against same tests as the JS parser implementation.
 *
 * @package gutenberg
 */

// Include the generated parser.
require_once __DIR__ . '/../token-parser.php';

$count = 0;
$tokens = [];

$output = WP_Token_Parser::swap_tokens(
	function ( $token ) use ( &$count, &$tokens ) {
		$tokens[] = $token;
		return '{{TOKEN_' . ++$count . '}}';
	},
	file_get_contents( 'php://stdin' )
);

echo json_encode( [ 'tokens' => $tokens, 'output' => $output ] );
