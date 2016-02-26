<?php

/**
 * Resets various `$_SERVER` variables that can get altered during tests.
 */
function tests_reset__SERVER() {
	$_SERVER['HTTP_HOST']       = WP_TESTS_DOMAIN;
	$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
	$_SERVER['REQUEST_METHOD']  = 'GET';
	$_SERVER['REQUEST_URI']     = '';
	$_SERVER['SERVER_NAME']     = WP_TESTS_DOMAIN;
	$_SERVER['SERVER_PORT']     = '80';
	$_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';

	unset( $_SERVER['HTTP_REFERER'] );
	unset( $_SERVER['HTTPS'] );
}

// For adding hooks before loading WP
function tests_add_filter($tag, $function_to_add, $priority = 10, $accepted_args = 1) {
	global $wp_filter, $merged_filters;

	$idx = _test_filter_build_unique_id($tag, $function_to_add, $priority);
	$wp_filter[$tag][$priority][$idx] = array('function' => $function_to_add, 'accepted_args' => $accepted_args);
	unset( $merged_filters[ $tag ] );
	return true;
}

function _test_filter_build_unique_id($tag, $function, $priority) {
	global $wp_filter;
	static $filter_id_count = 0;

	if ( is_string($function) )
		return $function;

	if ( is_object($function) ) {
		// Closures are currently implemented as objects
		$function = array( $function, '' );
	} else {
		$function = (array) $function;
	}

	if (is_object($function[0]) ) {
		return spl_object_hash($function[0]) . $function[1];
	} else if ( is_string($function[0]) ) {
		// Static Calling
		return $function[0].$function[1];
	}
}

function _delete_all_posts() {
	global $wpdb;

	$all_posts = $wpdb->get_col("SELECT ID from {$wpdb->posts}");
	if ($all_posts) {
		foreach ($all_posts as $id)
			wp_delete_post( $id, true );
	}
}

class Basic_Object {
	private $foo = 'bar';

	public function __get( $name ) {
		return $this->$name;
	}

	public function __set( $name, $value ) {
		return $this->$name = $value;
	}

	public function __isset( $name ) {
		return isset( $this->$name );
	}

	public function __unset( $name ) {
		unset( $this->$name );
	}

	public function __call( $name, $arguments ) {
		return call_user_func_array( array( $this, $name ), $arguments );
	}

	private function callMe() {
		return 'maybe';
	}
}

class Basic_Subclass extends Basic_Object {}

function _wp_die_handler( $message, $title = '', $args = array() ) {
	if ( !$GLOBALS['_wp_die_disabled'] ) {
		_wp_die_handler_txt( $message, $title, $args);
	} else {
		//Ignore at our peril
	}
}

function _disable_wp_die() {
	$GLOBALS['_wp_die_disabled'] = true;
}

function _enable_wp_die() {
	$GLOBALS['_wp_die_disabled'] = false;
}

function _wp_die_handler_filter() {
	return '_wp_die_handler';
}

function _wp_die_handler_txt( $message, $title, $args ) {
	echo "\nwp_die called\n";
	echo "Message : $message\n";
	echo "Title : $title\n";
	if ( ! empty( $args ) ) {
		echo "Args: \n";
		foreach( $args as $k => $v ){
			echo "\t $k : $v\n";
		}
	}
}

/**
 * Set a permalink structure.
 *
 * Hooked as a callback to the 'populate_options' action, we use this function to set a permalink structure during
 * `wp_install()`, so that WP doesn't attempt to do a time-consuming remote request.
 *
 * @since 4.2.0
 */
function _set_default_permalink_structure_for_tests() {
	update_option( 'permalink_structure', '/%year%/%monthnum%/%day%/%postname%/' );
}

/**
 * Helper used with the `upload_dir` filter to remove the /year/month sub directories from the uploads path and URL.
 */
function _upload_dir_no_subdir( $uploads ) {
	$subdir = $uploads['subdir'];

	$uploads['subdir'] = '';
	$uploads['path'] = str_replace( $subdir, '', $uploads['path'] );
	$uploads['url'] = str_replace( $subdir, '', $uploads['url'] );

	return $uploads;
}

/**
 * Helper used with the `upload_dir` filter to set https upload URL.
 */ 
function _upload_dir_https( $uploads ) {
	$uploads['url'] = str_replace( 'http://', 'https://', $uploads['url'] );
	$uploads['baseurl'] = str_replace( 'http://', 'https://', $uploads['baseurl'] );

	return $uploads;
}
