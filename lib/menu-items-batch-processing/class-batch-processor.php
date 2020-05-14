<?php

namespace WP_REST_Menu_Items_Batch_Operation;

use \WP_Error;
use \WP_REST_Menu_Items_Controller;

require_once __DIR__ . '/class-operation.php';
require_once __DIR__ . '/class-delete-operation.php';
require_once __DIR__ . '/class-update-operation.php';
require_once __DIR__ . '/class-unsupported-operation.php';

/**
 * Class to batch-process multiple menu items in a single request
 *
 * @see WP_REST_Posts_Controller
 */
class Batch_Processor {

	private $controller;
	private $request;

	public function __construct( WP_REST_Menu_Items_Controller $controller, $request ) {
		global $wpdb;

		$this->request = $request;
		$this->controller = $controller;
		$this->wpdb = $wpdb;
	}

	public function process( $navigation_id, $tree ) {
		$validated_operations = $this->batch_validate( $navigation_id, $tree );
		if ( is_wp_error( $validated_operations ) ) {
			return $validated_operations;
		}

		do_action( 'menu_items_batch_processing_start', $navigation_id );

		$result = $this->batch_persist( $validated_operations );

		if ( is_wp_error( $result ) ) {
			// We're in a broken state now, some operations succeeded and some other failed.
			// This is okay for the experimental version 1.
			// In the future let's wrap this in a transaction if WP tables are based on InnoDB
			// and do something smart on rollback - e.g. try to restore the original state, or
			// refresh all the caches that were affected in the process.
			do_action( 'menu_items_batch_processing_failure', $navigation_id );

			return $result;
		}

		do_action( 'menu_items_batch_processing_success', $navigation_id );

		return $result;
	}

	protected function batch_validate( $navigation_id, $input_tree ) {
		$operations = $this->diff( $navigation_id, $input_tree );

		// Not sure what to do with these positions yet - maybe we should send nothing over
		// the wire and just assign them here based on the order of received data?
		$this->controller->validate_order_and_hierarchy = false;
		foreach ( $operations as $operation ) {
			$result = $operation->validate();
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		return $operations;
	}

	protected function diff( $navigation_id, $tree ) {
		$current_menu_items = $this->controller->get_menu_items( $navigation_id );
		$operations = [];

		$stack = [
			[ null, $tree ],
		];
		$updated_ids = [];
		while ( ! empty( $stack ) ) {
			list( $parent_operation, $raw_menu_items ) = array_pop( $stack );
			foreach ( $raw_menu_items as $n => $raw_menu_item ) {
				$children = ! empty( $raw_menu_item['children'] ) ? $raw_menu_item['children'] : [];
				unset( $raw_menu_item['children'] );
				$raw_menu_item['menu_order'] = $n + 1;

				if ( ! empty( $raw_menu_item['id'] ) ) {
					$updated_ids[] = $raw_menu_item['id'];
					$operation = new UpdateOperation( $this->controller, $raw_menu_item, $parent_operation );
					$operations[] = $operation;
				} else {
					// Inserts are handled "as we go" by use-navigation-blocks.js
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
				$operations[] = new DeleteOperation( $this->controller, [ 'menus' => $navigation_id, 'force' => true, 'id' => $item->ID ] );
			}
		}

		return $operations;
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
