<?php
/**
 * Distributed editing prototype bootstrap.
 *
 * Prototype of the server-authoritative "blessing" save model: compare-and-swap
 * versioning, block-level capability enforcement, hash-pinned approval of
 * protected content, and default-deny sequestration of unapproved protected
 * changes as pending edits.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-gutenberg-distributed-editing-engine.php';
require_once __DIR__ . '/class-gutenberg-rest-distributed-editing-controller.php';
require_once __DIR__ . '/class-gutenberg-distributed-editing-rest-save.php';

Gutenberg_Distributed_Editing_REST_Save::init();

if ( ! function_exists( 'gutenberg_distributed_editing_register_routes' ) ) {
	/**
	 * Registers the distributed editing REST routes.
	 */
	function gutenberg_distributed_editing_register_routes() {
		$controller = new Gutenberg_REST_Distributed_Editing_Controller();
		$controller->register_routes();
	}
	add_action( 'rest_api_init', 'gutenberg_distributed_editing_register_routes' );
}

if ( ! function_exists( 'gutenberg_distributed_editing_register_block' ) ) {
	/**
	 * Registers the pending-review block server-side for front-end rendering.
	 *
	 * The block is a void block whose attributes carry the inert proposed
	 * payload and the safe placeholder. The render callback outputs only the
	 * placeholder, so the proposed payload never renders outside an explicit
	 * editor review. The editor UI is registered separately in the client script.
	 */
	function gutenberg_distributed_editing_register_block() {
		if ( ! function_exists( 'register_block_type' ) || \WP_Block_Type_Registry::get_instance()->is_registered( 'de/pending-review' ) ) {
			return;
		}
		register_block_type(
			'de/pending-review',
			array(
				'attributes'      => array(
					'pendingId'    => array( 'type' => 'string' ),
					'placeholder'  => array( 'type' => 'string' ),
					'proposed'     => array( 'type' => 'string' ),
					'proposedHash' => array( 'type' => 'string' ),
					'proposer'     => array( 'type' => 'number' ),
				),
				'render_callback' => array( 'Gutenberg_Distributed_Editing_Engine', 'render_pending_review' ),
			)
		);
	}
	add_action( 'init', 'gutenberg_distributed_editing_register_block' );
}

if ( ! function_exists( 'gutenberg_distributed_editing_enqueue_assets' ) ) {
	/**
	 * Enqueues the build-free editor client for the prototype.
	 */
	function gutenberg_distributed_editing_enqueue_assets() {
		$script_path = __DIR__ . '/distributed-editing.js';
		wp_enqueue_script(
			'gutenberg-distributed-editing',
			gutenberg_url( 'lib/experimental/distributed-editing/distributed-editing.js' ),
			array(
				'wp-api-fetch',
				'wp-block-editor',
				'wp-blocks',
				'wp-components',
				'wp-data',
				'wp-editor',
				'wp-element',
				'wp-i18n',
				'wp-notices',
				'wp-plugins',
			),
			(string) filemtime( $script_path ),
			true
		);
	}
	add_action( 'enqueue_block_editor_assets', 'gutenberg_distributed_editing_enqueue_assets' );
}
