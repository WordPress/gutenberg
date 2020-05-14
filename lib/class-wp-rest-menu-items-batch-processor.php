<?php

/**
 * Class that processes a batch of menu item updates and deletes.
 *
 * @see WP_REST_Posts_Controller
 */
class WP_REST_Menu_Items_Batch_Processor {

	const UPDATE = 'update';
	const DELETE = 'delete';

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

		$validated_batch = $this->batch_validate( $batch );
		if ( is_wp_error( $validated_batch ) ) {
			return $validated_batch;
		}

		do_action( 'menu_items_batch_processing_start', $this->navigation_id );

		$result = $this->batch_persist( $validated_batch );

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

		// Compute all necessary Updates
		while ( ! empty( $stack ) ) {
			list( $parent_operation, $raw_menu_items ) = array_pop( $stack );
			foreach ( $raw_menu_items as $n => $raw_menu_item ) {
				$children = ! empty( $raw_menu_item['children'] ) ? $raw_menu_item['children'] : [];
				unset( $raw_menu_item['children'] );
				// Let's infer the menu order and parent id from the input tree
				$raw_menu_item['menu_order'] = $n + 1;
				$raw_menu_item['parent'] = $parent_operation ? $parent_operation[1]['id'] : 0;

				if ( ! empty( $raw_menu_item['id'] ) ) {
					$updated_ids[] = $raw_menu_item['id'];
					$operation = [ static::UPDATE, $raw_menu_item ];
					$operations[] = $operation;
				} else {
					// Inserts are slow so we don't allow them here. Instead they are handled "on the fly"
					// by use-navigation-blocks.js so that this code may deal exclusively with the updates.
					return new WP_Error(
						"Attempted to insert a new menu item using batch processing - it is unsupported. " .
						"Batch processing can only delete and update existing items."
					);
				}

				if ( $children ) {
					array_push( $stack, [ $operation, $children ] );
				}
			}
		}

		// Delete any orphaned items
		foreach ( $current_menu_items as $item ) {
			if ( ! in_array( $item->ID, $updated_ids ) ) {
				$operations[] = [ static::DELETE, [ 'menus' => $this->navigation_id, 'force' => true, 'id' => $item->ID ] ];
			}
		}

		return $operations;
	}

	protected function batch_validate( $batch ) {
		// We infer the menu order and parent id from the received input tree so there's no need
		// to validate them in the controller
		foreach ( $batch as $k => list( $type, $input ) ) {
			$request = new WP_REST_Request();
			$request->set_default_params($input);
			$request->set_param( 'validate_order_and_hierarchy', false );
			if ( $type === static::UPDATE ) {
				$result = $this->controller->update_item_validate( $request );
			} elseif ( $type === static::DELETE ) {
				$result = $this->controller->delete_item_validate( $request );
			}
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			$batch[ $k ][] = $result;
		}

		return $batch;
	}

	protected function batch_persist( $validated_operations ) {
		foreach ( $validated_operations as $operation ) {
			list( $type, $input, $prepared_nav_item ) = $operation;
			$request = new WP_REST_Request();
			$request->set_default_params($input);
			if ( $type === static::UPDATE ) {
				$result = $this->controller->update_item_persist( $prepared_nav_item, $request );
			} elseif ( $type === static::DELETE ) {
				$result = $this->controller->delete_item_persist( $request );
			}

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			if ( $type === static::UPDATE ) {
				$this->controller->update_item_notify( $result, $request );
			} elseif ( $type === static::DELETE ) {
				$this->controller->delete_item_notify( $result, new WP_REST_Response(), $request );
			}
		}
	}

}
