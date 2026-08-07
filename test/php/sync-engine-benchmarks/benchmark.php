<?php
/**
 * Sync-engine benchmark CLI — runs INSIDE WordPress (the engines need
 * get_post/serialize_block and a $wpdb for the ingest lock), so invoke it
 * through wp-cli's eval-file in the environment under test:
 *
 *   wp eval-file test/php/sync-engine-benchmarks/benchmark.php \
 *       engine=intent-log scenario=mixed-newsroom \
 *       rounds=200 clients=4 paragraphs=8 seed=42 json=out.json
 *
 * (Pass options as bare `key=value` tokens — wp-cli would claim `--flags`
 * as its own parameters.)
 *
 * Compare engines by running both slugs over the same scenario/seed. The
 * intent log reports full cost AND policy-correct quality (applied /
 * escalated-for-review / lost); the yjs relay reports cost only — its merge
 * runs on the client, so the server cannot score quality (shown as
 * unobservable, never faked). See README.md.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run this through: wp eval-file benchmark.php -- <options>\n" );
	exit( 1 );
}

require_once __DIR__ . '/class-wp-sync-bench-memory-storage.php';
require_once __DIR__ . '/class-wp-sync-bench-workload.php';
require_once __DIR__ . '/class-wp-sync-bench-runner.php';

/**
 * Parses `key=value` (or `--key=value`) tokens into an options map.
 *
 * @param array $tokens Argument tokens.
 * @return array Options map.
 */
if ( ! function_exists( 'wp_sync_bench_parse_args' ) ) {
	function wp_sync_bench_parse_args( array $tokens ): array {
		$options = array();
		foreach ( $tokens as $arg ) {
			if ( preg_match( '/^-{0,2}([a-z0-9-]+)=(.*)$/', (string) $arg, $m ) ) {
				$options[ $m[1] ] = $m[2];
			}
		}
		return $options;
	}
}

// wp-cli eval-file exposes positional tokens as $args; fall back to $argv.
$wp_sync_bench_opts = wp_sync_bench_parse_args(
	isset( $args ) && is_array( $args ) ? $args : ( $argv ?? array() )
);

$engine_slug = $wp_sync_bench_opts['engine'] ?? 'intent-log';
$scenario    = $wp_sync_bench_opts['scenario'] ?? 'mixed-newsroom';
$rounds      = (int) ( $wp_sync_bench_opts['rounds'] ?? 200 );
$clients     = (int) ( $wp_sync_bench_opts['clients'] ?? 4 );
$paragraphs  = (int) ( $wp_sync_bench_opts['paragraphs'] ?? 8 );
$seed        = (int) ( $wp_sync_bench_opts['seed'] ?? 42 );

if ( ! array_key_exists( $scenario, WP_Sync_Bench_Workload::scenarios() ) ) {
	fwrite( STDERR, "Unknown scenario: {$scenario}\n" );
	fwrite( STDERR, 'Scenarios: ' . implode( ', ', array_keys( WP_Sync_Bench_Workload::scenarios() ) ) . "\n" );
	exit( 1 );
}

$storage = new WP_Sync_Bench_Memory_Storage();
if ( 'yjs-relay' === $engine_slug ) {
	$engine = new WP_Yjs_Relay_Engine( $storage );
} elseif ( 'intent-log' === $engine_slug ) {
	$engine = new WP_Intent_Log_Engine( $storage );
} else {
	fwrite( STDERR, "Unknown engine: {$engine_slug} (intent-log | yjs-relay)\n" );
	exit( 1 );
}

$workload = WP_Sync_Bench_Workload::build( $scenario, $seed, $rounds, $clients, $paragraphs );
$post_id  = wp_insert_post(
	array(
		'post_type'    => 'post',
		'post_status'  => 'draft',
		'post_title'   => 'Sync benchmark',
		'post_content' => $workload['post_content'],
	)
);

$report = WP_Sync_Bench_Runner::run( $engine, $storage, (int) $post_id, $workload );
wp_delete_post( (int) $post_id, true );

$report['config'] = array(
	'engine'     => $engine_slug,
	'scenario'   => $scenario,
	'rounds'     => $rounds,
	'clients'    => $clients,
	'paragraphs' => $paragraphs,
	'seed'       => $seed,
);

$q = $report['quality'];
printf( "\n== %s / %s ==\n", $report['engine'], $report['scenario'] );
printf( "config: rounds=%d clients=%d paragraphs=%d seed=%d\n", $rounds, $clients, $paragraphs, $seed );
printf( "requests: %d\n", $report['requests'] );
printf(
	"service ms: p50=%.4f p90=%.4f p99=%.4f max=%.4f mean=%.4f\n",
	$report['service_us']['p50'],
	$report['service_us']['p90'],
	$report['service_us']['p99'],
	$report['service_us']['max'],
	$report['service_us']['mean']
);
printf(
	"payload bytes: req p50=%d max=%d / resp p50=%d max=%d\n",
	$report['payload_bytes']['request_p50'],
	$report['payload_bytes']['request_max'],
	$report['payload_bytes']['response_p50'],
	$report['payload_bytes']['response_max']
);
printf( "storage: rows=%d bytes=%d\n", $report['storage']['rows'], $report['storage']['bytes'] );
if ( $q['observable'] ) {
	printf(
		"quality: converged=%s applied=%d escalated=%d voided=%d escalation_rate=%.4f lost_work=%d\n",
		$q['converged'] ? 'yes' : 'NO',
		$q['dispositions']['applied'],
		$q['dispositions']['escalated'],
		$q['dispositions']['voided'],
		$q['escalation_rate'],
		$q['lost_work']
	);
} else {
	printf( "quality: NOT SERVER-OBSERVABLE (client-side CRDT merge)\n" );
}

if ( ! empty( $wp_sync_bench_opts['json'] ) ) {
	file_put_contents( (string) $wp_sync_bench_opts['json'], wp_json_encode( $report ) );
	printf( "wrote %s\n", $wp_sync_bench_opts['json'] );
}
echo "\n";
