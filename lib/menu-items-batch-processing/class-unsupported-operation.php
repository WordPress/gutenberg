<?php

namespace WP_REST_Menu_Items_Batch_Operation;

use \WP_Error;

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
