<?php

namespace WP_REST_Menu_Items_Batch_Operation;

class UpdateOperation extends Operation {

	public function doValidate() {
		return $this->controller->update_item_validate(  $this->input );
	}

	public function doPersist( $request ) {
		return $this->controller->update_item_persist( $this->prepared_item, $this->input, $request );
	}

	public function notify( $request ) {
		return $this->controller->update_item_notify( $this->result, $request );
	}

}
