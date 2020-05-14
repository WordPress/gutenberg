<?php

/**
 * Class to batch-process multiple menu items in a single request
 *
 * @see WP_REST_Posts_Controller
 */
class WP_REST_Menu_Items_Batch_Processor {

	private $controller;
	private $request;

	public function __construct( WP_REST_Menu_Items_Controller $controller, $request ) {
		global $wpdb;

		$this->request = $request;
		$this->controller = $controller;
		$this->wpdb = $wpdb;
	}

	public function process( $navigation_id, $tree ) {
		$validated_operations = $this->bulk_validate( $navigation_id, $tree );
		if ( is_wp_error( $validated_operations ) ) {
			return $validated_operations;
		}

		// Transactions may or may not be supported in the current environment.
		// Ideally we would know and only use them if they are. For the purpose of this prototype,
		// let's simplify that dilemma by just ignoring the result of those queries.
		$this->wpdb->query( 'START TRANSACTION' );
		$this->wpdb->query( 'SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ' );

		$result = $this->bulk_persist( $validated_operations );

		if ( is_wp_error( $result ) ) {
			$this->wpdb->query( 'ROLLBACK' );

			return $result;
		}

		$this->wpdb->query( 'COMMIT' );

		// @TODO: figure out how to handle rest_insert_ and rest_after_insert_ hooks

		return $result;
	}

	protected function bulk_validate( $navigation_id, $input_tree ) {
		$operations = $this->diff( $navigation_id, $input_tree );

		// Not sure what to do with these positions yet - maybe we should send nothing over
		// the wire and just assign them here based on the order of received data?
		$this->controller->ignore_position_collision = true;
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

	protected function bulk_persist( $validated_operations ) {
		foreach ( $validated_operations as $operation ) {
			$result = $operation->persist( $this->request );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			$operation->notify( $this->request );
		}
	}

}

// It would be great to move these to a separate file:

abstract class Operation {
	const INSERT = 'insert';
	const UPDATE = 'update';
	const DELETE = 'delete';

	protected $controller;
	public $input;
	/** @var Operation */
	public $parent;
	public $prepared_item;
	public $result;

	/**
	 * Operation constructor.
	 *
	 * I really dislike the dependency on $controller, but core code is quite interlocked. I don't think
	 * it's possible to get rid of that without fundamental refactoring of WP_REST_Posts_Controller
	 * which is outside of scope of this change.
	 *
	 * @param $input
	 * @param $parent
	 * @param $result
	 */
	public function __construct( WP_REST_Menu_Items_Controller $controller, $input, $parent = null ) {
		$this->controller = $controller;
		$this->input = $input;
		$this->parent = $parent;
	}

	public function validate() {
		$result = $this->doValidate();
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$this->prepared_item = $result;

		return $result;
	}

	abstract protected function doValidate();

	public function persist( $request ) {
		if ( ! empty( $this->parent ) && $this->prepared_item ) {
			$this->prepared_item['menu-item-parent-id'] = $this->parent->result->ID;
		}

		$this->result = $this->doPersist( $request );

		return $this->result;
	}

	abstract protected function doPersist( $request );

	abstract public function notify( $request );
}

class UnsupportedOperation extends Operation {

	public function doValidate() {
		return new WP_Error( "This operation is unsupported" );
	}

	public function doPersist( $request ) {
		return new WP_Error( "Not implemented" );
	}

	public function notify( $request ) {
		return new WP_Error( "Not implemented" );
	}

}

class UpdateOperation extends Operation {

	public function doValidate() {
		return $this->controller->update_item_validate( $this->input['id'], $this->input );
	}

	public function doPersist( $request ) {
		return $this->controller->update_item_persist( $this->prepared_item, $this->input, $request );
	}

	public function notify( $request ) {
		return $this->controller->update_item_notify( $this->result, $request );
	}

}

class DeleteOperation extends Operation {

	public function doValidate() {
		return $this->controller->delete_item_validate( $this->input['id'], $this->input );
	}

	/**
	 * Deleting may fail if menu item was already deleted earlier. Later on we could get
	 * smarter with classifying the type of the failure, for now let's just fail silently.
	 */
	public function doPersist( $request ) {
		$this->controller->delete_item_persist( $this->input['id'] );
	}

	public function notify( $request ) {
		$response = new WP_REST_Response();

		return $this->controller->delete_item_notify( $this->result, $response, $request );
	}

}
