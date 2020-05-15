<?php
/**
 * REST API: WP_REST_Menu_Items_Batch_Processor class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Class that processes a batch of menu item updates and deletes.
 *
 * @see WP_REST_Posts_Controller
 */
class WP_REST_Menu_Items_Batch_Processor {

	const UPDATE = 'update';
	const DELETE = 'delete';

	/**
	 * The ID of menu to process.
	 *
	 * @var int
	 */
	private $navigation_id;

	/**
	 * Instance of parent WP_REST_Posts_Controller.
	 *
	 * @var WP_REST_Posts_Controller
	 */
	private $controller;

	/**
	 * Full details about the request.
	 *
	 * @var WP_REST_Request
	 */
	private $request;

	/**
	 * WP_REST_Menu_Items_Batch_Processor constructor.
	 *
	 * @param int                           $navigation_id The ID of menu to process.
	 * @param WP_REST_Menu_Items_Controller $controller Instance of parent WP_REST_Posts_Controller.
	 * @param WP_REST_Request               $request Full details about the request.
	 */
	public function __construct( $navigation_id, WP_REST_Menu_Items_Controller $controller, $request ) {
		global $wpdb;

		$this->navigation_id = $navigation_id;
		$this->request       = $request;
		$this->controller    = $controller;
		$this->wpdb          = $wpdb;
	}

	/**
	 * Brings the stored menu items to the state described by $raw_input. Validates the entire
	 * input upfront and short-circuits if it's invalid.
	 *
	 * @param object $raw_input Raw input from the client - a tree of menu items that the user wants to persist.
	 *
	 * @return void|WP_Error Nothing on success, WP_Error carrying the data about specific input that caused the problem on failure
	 */
	public function process( $raw_input ) {
		$batch = $this->compute_batch( $raw_input );
		if ( is_wp_error( $batch ) ) {
			return $batch;
		}

		$validated_batch = $this->validate_batch( $batch );
		if ( is_wp_error( $validated_batch ) ) {
			return $validated_batch;
		}

		do_action( 'menu_items_batch_processing_start', $this->navigation_id );

		$result = $this->persist_batch( $validated_batch );

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

	/**
	 * Computes a list of updates and deletes necessary to reshape the current DB state into the one described by $input_tree.
	 *
	 * @param object $input_tree Raw input from the client - a tree of menu items that the user wants to persist.
	 *
	 * @return array|WP_Error List of operations on success, WP_Error carrying the data about specific input that caused the problem on failure.
	 */
	public function compute_batch( $input_tree ) {
		$current_menu_items = $this->controller->get_menu_items( $this->navigation_id );
		$operations         = array();

		$stack       = array(
			array( null, $input_tree ),
		);
		$updated_ids = array();

		// Compute all necessary Updates.
		while ( ! empty( $stack ) ) {
			list( $parent_operation, $raw_menu_items ) = array_pop( $stack );
			foreach ( $raw_menu_items as $n => $raw_menu_item ) {
				$children = ! empty( $raw_menu_item['children'] ) ? $raw_menu_item['children'] : array();
				unset( $raw_menu_item['children'] );
				// Let's infer the menu order and parent id from the input tree.
				$raw_menu_item['menu_order'] = $n + 1;
				$raw_menu_item['parent']     = $parent_operation ? $parent_operation[1]['id'] : 0;

				if ( ! empty( $raw_menu_item['id'] ) ) {
					$updated_ids[] = $raw_menu_item['id'];
					$operation     = array( static::UPDATE, $raw_menu_item );
					$operations[]  = $operation;
				} else {
					// Inserts are slow so we don't allow them here. Instead they are handled "on the fly"
					// by use-navigation-blocks.js so that this code may deal exclusively with the updates.
					return new WP_Error( 'insert_unsupported', __( 'Cannot insert new items using batch processing.', 'gutenberg' ), array( 'status' => 400 ) );
				}

				if ( $children ) {
					array_push( $stack, array( $operation, $children ) );
				}
			}
		}

		// Delete any orphaned items.
		foreach ( $current_menu_items as $item ) {
			if ( ! in_array( $item->ID, $updated_ids, true ) ) {
				$operations[] = array(
					static::DELETE,
					array(
						'menus' => $this->navigation_id,
						'force' => true,
						'id'    => $item->ID,
					),
				);
			}
		}

		return $operations;
	}

	/**
	 * Validates the list of operations from compute_batch.
	 *
	 * @param object $batch Output of compute_batch.
	 *
	 * @return array|WP_Error List of validated operations enriched with the database-ready arrays on success, WP_Error carrying the data about specific input that caused the problem on failure.
	 */
	public function validate_batch( $batch ) {
		// We infer the menu order and parent id from the received input tree so there's no need
		// to validate them in the controller.
		foreach ( $batch as $k => list( $type, $input ) ) {
			$request = new WP_REST_Request();
			$request->set_default_params( $input );
			$request->set_param( 'validate_order_and_hierarchy', false );
			if ( static::UPDATE === $type ) {
				$result = $this->controller->update_item_validate( $request );
			} elseif ( static::DELETE === $type ) {
				$result = $this->controller->delete_item_validate( $request );
			}
			if ( is_wp_error( $result ) ) {
				$result->add_data( $input, 'input' );
				return $result;
			}
			$batch[ $k ][] = $result;
		}

		return $batch;
	}

	/**
	 * Executes the operations prepared by compute_batch and validate_batch.
	 *
	 * @param object $validated_operations Output of batch_validate.
	 *
	 * @return void|WP_Error Nothing on success, WP_Error carrying the data about specific input that caused the problem on failure.
	 */
	public function persist_batch( $validated_operations ) {
		foreach ( $validated_operations as $operation ) {
			list( $type, $input, $prepared_nav_item ) = $operation;
			$request                                  = new WP_REST_Request();
			$request->set_default_params( $input );
			if ( static::UPDATE === $type ) {
				$result = $this->controller->update_item_persist( $prepared_nav_item, $request );
			} elseif ( static::DELETE === $type ) {
				$result = $this->controller->delete_item_persist( $request );
			}

			if ( is_wp_error( $result ) ) {
				$result->add_data( $input, 'input' );
				return $result;
			}

			if ( static::UPDATE === $type ) {
				$this->controller->update_item_notify( $result, $request );
			} elseif ( static::DELETE === $type ) {
				$this->controller->delete_item_notify( $result, new WP_REST_Response(), $request );
			}
		}
	}

}
