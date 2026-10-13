<?php
// Temporary diagnostics: logs where a request spends its time.
function diag_log( $line ) {
	$uri = $_SERVER['REQUEST_URI'] ?? '';
	if ( false === strpos( $uri, 'post-new.php' ) && false === strpos( $uri, 'wp-cron.php' ) ) {
		return;
	}
	file_put_contents( ABSPATH . 'timing.log', sprintf( "%.2f %-12s %6.2fs %s\n", microtime( true ), strtok( basename( $uri ), '?' ), microtime( true ) - $_SERVER['REQUEST_TIME_FLOAT'], $line ), FILE_APPEND );
}
diag_log( 'mu-plugins loaded' );
$GLOBALS['diag_last'] = array( microtime( true ), 'start' );
add_action( 'all', function ( $hook ) {
	$now = microtime( true );
	list( $last, $previous ) = $GLOBALS['diag_last'];
	if ( $now - $last > 0.5 ) {
		diag_log( sprintf( 'gap %.2fs between %s and %s', $now - $last, $previous, $hook ) );
	}
	$GLOBALS['diag_last'] = array( $now, $hook );
} );
foreach ( array( 'plugins_loaded', 'init', 'admin_init', 'current_screen', 'admin_enqueue_scripts', 'admin_footer', 'shutdown', 'wp_loaded' ) as $phase ) {
	add_action( $phase, function () use ( $phase ) {
		diag_log( $phase );
	}, PHP_INT_MAX );
}
add_filter( 'rest_pre_dispatch', function ( $result, $server, $request ) {
	$GLOBALS['diag_rest'][ $request->get_route() ] = microtime( true );
	diag_log( 'rest start ' . $request->get_route() );
	return $result;
}, 10, 3 );
add_filter( 'rest_post_dispatch', function ( $response, $server, $request ) {
	diag_log( sprintf( 'rest end %s %.2fs', $request->get_route(), microtime( true ) - $GLOBALS['diag_rest'][ $request->get_route() ] ) );
	return $response;
}, 10, 3 );
add_action( 'http_api_debug', function ( $response, $context, $class, $args, $url ) {
	diag_log( 'http ' . substr( $url, 0, 80 ) );
}, 10, 5 );
add_action( 'shutdown', function () {
	diag_log( 'cron events ran: ' . implode( ',', $GLOBALS['diag_cron'] ?? array() ) );
} );
foreach ( array_keys( (array) _get_cron_array() ) as $diag_time ) {
	foreach ( array_keys( _get_cron_array()[ $diag_time ] ) as $diag_hook ) {
		add_action( $diag_hook, function () use ( $diag_hook ) {
			$GLOBALS['diag_cron'][] = $diag_hook;
			diag_log( 'cron ' . $diag_hook );
		}, -1 );
	}
}
