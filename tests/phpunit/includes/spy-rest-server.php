<?php

class Spy_REST_Server extends WP_REST_Server {

	public $sent_headers = array();
	public $sent_body = '';

	/**
	 * Get the raw $endpoints data from the server
	 *
	 * @return array
	 */
	public function get_raw_endpoint_data() {
		return $this->endpoints;
	}

	/**
	 * Allow calling protected methods from tests
	 *
	 * @param string $method Method to call
	 * @param array $args Arguments to pass to the method
	 * @return mixed
	 */
	public function __call( $method, $args ) {
		return call_user_func_array( array( $this, $method ), $args );
	}

	public function send_header( $header, $value ) {
		$this->sent_headers[ $header ] = $value;
	}

	public function serve_request( $path = null ) {

		ob_start();
		$result = parent::serve_request( $path );
		$this->sent_body = ob_get_clean();
		return $result;
	}
}
