<?php

class WP_UnitTest_Factory_Callback_After_Create {
	var $callback;

	function __construct( $callback ) {
		$this->callback = $callback;
	}

	function call( $object ) {
		return call_user_func( $this->callback, $object );
	}
}
