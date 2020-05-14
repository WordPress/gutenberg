<?php

namespace WP_REST_Menu_Items_Batch_Operation;

use \WP_Error;
use \WP_REST_Menu_Items_Controller;

require_once __DIR__ . '/class-operation.php';
require_once __DIR__ . '/class-delete-operation.php';
require_once __DIR__ . '/class-update-operation.php';
require_once __DIR__ . '/class-unsupported-operation.php';

/**
 * Class that processes a batch of menu item updates and deletes.
 *
 * @see WP_REST_Posts_Controller
 */
class Batch_Processor {

	private $navigation_id;
	private $controller;
	private $request;

	public function __construct( $navigation_id, WP_REST_Menu_Items_Controller $controller, $request ) {
		global $wpdb;

		$this->navigation_id = $navigation_id;
		$this->request = $request;
		$this->controller = $controller;
		$this->wpdb = $wpdb;
	}

	/**
	 * Brings the stored menu items to the state described by $raw_input. Validates the entire
	 * input upfront and short-circuits if it's invalid.
	 *
	 * @param $raw_input
	 *
	 * @return array|mixed
	 */
	public function process( $raw_input ) {
		$batch = $this->compute_batch( $raw_input );

		$error = $this->batch_validate( $batch );
		if ( is_wp_error( $error ) ) {
			return $error;
		}

		do_action( 'menu_items_batch_processing_start', $this->navigation_id );

		$result = $this->batch_persist( $batch );

		if ( is_wp_error( $result ) ) {
			// We're in a broken state now, some operations succeeded and some other failed.
			// This is okay for the experimental version 1.
			// In the future let's wrap this in a transaction if WP tables are based on InnoDB
			// and do something smart on rollback - e.g. try to restore the original state, or
			// refresh all the caches that were affected in the process.
			do_action( 'menu_items_batch_processing_failure', $this->navigation_id );

			return $result;
		}

		do_action( 'menu_items_batch_processing_success', $this->navigation_id );

		return $result;
	}

	protected function compute_batch( $input_tree ) {
		$current_menu_items = $this->controller->get_menu_items( $this->navigation_id );
		$operations = [];

		$stack = [
			[ null, $input_tree ],
		];
		$updated_ids = [];
		// Compute all the necessary Updates
		while ( ! empty( $stack ) ) {
			list( $parent_operation, $raw_menu_items ) = array_pop( $stack );
			foreach ( $raw_menu_items as $n => $raw_menu_item ) {
				$children = ! empty( $raw_menu_item['children'] ) ? $raw_menu_item['children'] : [];
				unset( $raw_menu_item['children'] );
				// Let's infer the menu order and parent id from the input tree
				$raw_menu_item['menu_order'] = $n + 1;
				$raw_menu_item['parent'] = $parent_operation ? $parent_operation->input['id'] : 0;

				if ( ! empty( $raw_menu_item['id'] ) ) {
					$updated_ids[] = $raw_menu_item['id'];
					$operation = new UpdateOperation( $this->controller, $raw_menu_item, $parent_operation );
					$operations[] = $operation;
				} else {
					// Inserts are slow so we don't allow them here. Instead they are handled "on the fly"
					// by use-navigation-blocks.js so that this code may deal exclusively with the updates.
					$operation = new UnsupportedOperation( $this->controller, $raw_menu_item, $parent_operation );
					$operations[] = $operation;
				}

				if ( $children ) {
					array_push( $stack, [ $operation, $children ] );
				}
			}
		}

		// Delete any orphaned items
		foreach ( $current_menu_items as $item ) {
			if ( ! in_array( $item->ID, $updated_ids ) ) {
				$operations[] = new DeleteOperation(
					$this->controller,
					[ 'menus' => $this->navigation_id, 'force' => true, 'id' => $item->ID ]
				);
			}
		}

		return $operations;
	}

	protected function batch_validate( $batch ) {
		// We infer the menu order and parent id from the received input tree so there's no need
		// to validate them in the controller
		$this->controller->validate_order_and_hierarchy = false;
		foreach ( $batch as $operation ) {
			$result = $operation->validate();
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
	}

	protected function batch_persist( $validated_operations ) {
		foreach ( $validated_operations as $operation ) {
			$result = $operation->persist( $this->request );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			$operation->notify( $this->request );
		}
	}

}
