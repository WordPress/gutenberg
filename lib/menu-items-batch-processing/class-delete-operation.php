<?php

namespace WP_REST_Menu_Items_Batch_Operation;

use \WP_Error;
use \WP_REST_Response;

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
