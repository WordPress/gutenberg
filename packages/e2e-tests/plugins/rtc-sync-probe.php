<?php
/**
 * Plugin Name: Gutenberg Test Plugin, RTC Sync Probe
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-rtc-sync-probe
 */

/**
 * Adds a passive sync provider that counts the Yjs updates and awareness
 * messages of the edited post's document, for collaboration e2e tests that
 * assert on sync traffic. It sends nothing: the real providers still carry
 * the document.
 */
function gutenberg_test_rtc_sync_probe_enqueue() {
	wp_register_script( 'gutenberg-test-rtc-sync-probe', false, array( 'wp-hooks' ), '1', true );
	wp_enqueue_script( 'gutenberg-test-rtc-sync-probe' );
	wp_add_inline_script(
		'gutenberg-test-rtc-sync-probe',
		<<<'JS'
( function () {
	var probe = ( window.__rtcSyncProbe = {
		local: { updates: 0, bytes: 0 },
		remote: { updates: 0, bytes: 0 },
		awareness: { local: 0, remote: 0 },
		ydoc: null,
		Y: null,
		reset: function () {
			probe.local = { updates: 0, bytes: 0 };
			probe.remote = { updates: 0, bytes: 0 };
			probe.awareness = { local: 0, remote: 0 };
		},
		docBytes: function () {
			return probe.ydoc && probe.Y
				? probe.Y.encodeStateAsUpdate( probe.ydoc ).length
				: null;
		},
	} );
	var noop = { destroy: function () {}, on: function () {} };
	window.wp.hooks.addFilter(
		'sync.providers',
		'gutenberg-test/rtc-sync-probe',
		function ( creators ) {
			return ( creators || [] ).concat( [
				async function ( options ) {
					if ( options.objectType !== 'postType/post' || ! options.objectId ) {
						return noop;
					}
					var ydoc = options.ydoc;
					var awareness = options.awareness;
					probe.ydoc = ydoc;
					probe.Y = options.Y;
					var onUpdate = function ( update, origin, doc, transaction ) {
						var side = transaction && transaction.local ? probe.local : probe.remote;
						side.updates++;
						side.bytes += update.length;
					};
					var onAwareness = function ( changes, origin ) {
						if ( origin === 'local' ) {
							probe.awareness.local++;
						} else {
							probe.awareness.remote++;
						}
					};
					ydoc.on( 'update', onUpdate );
					if ( awareness ) {
						awareness.on( 'update', onAwareness );
					}
					return {
						destroy: function () {
							ydoc.off( 'update', onUpdate );
							if ( awareness ) {
								awareness.off( 'update', onAwareness );
							}
						},
						on: function () {},
					};
				},
			] );
		},
		20
	);
} )();
JS
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_test_rtc_sync_probe_enqueue' );
