<?php

$rss[ 'start' ] = mem();

ini_set( 'max_execution_time', 120 );
ini_set( 'memory_limit', '512M' );

$count = $_GET['count'] ?: 1;
$document = file_get_contents( 'php://input' );

$rss[ 'beforeParserInit' ] = mem();
require_once '/parser.php';
$my_parser = new MyParser();
$rss[ 'afterParserInit' ] = mem();

$tic = microtime( true );
$parse = $my_parser->parse( $document );
$sentinel = 1;
for ( $i = 1; $i < $count; $i++ ) {
    $my_parser->parse( $document );
    $sentinel += $i;
}
$toc = microtime( true );
$rss[ 'end' ] = mem();

$runtime = ( $toc - $tic ) * 1e6;

header( 'Access-Control-Allow-Origin: *' );
echo json_encode( [
    'parse' => $parse,
    'µs' => $runtime,
    'µsAvg' => $runtime / $count,
    'rss' => $rss,
    'sentinel' => $sentinel,
] );

function mem() {
    return memory_get_process_usage();
}

/**
 * Returns memory usage from /proc<PID>/status in bytes.
 * 
 * @cite: http://drib.tech/programming/get-real-amount-memory-allocated-php
 *
 * @return int|bool sum of VmRSS and VmSwap in bytes. On error returns false.
 */
function memory_get_process_usage()
{
	$status = file_get_contents('/proc/' . getmypid() . '/status');
	
	$matches = [];
	preg_match_all('~^(?:VmRSS|VmSwap):\s*([0-9]+).*$~im', $status, $matches, PREG_SET_ORDER);
    
    return array_sum( array_column( $matches, 1 ) ) * 1024;
}
