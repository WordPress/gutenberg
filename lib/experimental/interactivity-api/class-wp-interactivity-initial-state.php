<?php
/**
 * WP_Interactivity_Initial_State class
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

if ( class_exists( 'WP_Interactivity_Initial_State' ) ) {
	return;
}

/**
 * Manages the initial state of the Interactivity API store in the server and
 * its serialization so it can be restored in the browser upon hydration.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */
class WP_Interactivity_Initial_State {
	/**
	 * Map of initial state by namespace.
	 *
	 * @var array
	 */
	private static $initial_state = array();

	/**
	 * Get state from a given namespace.
	 *
	 * @param string $store_ns Namespace.
	 *
	 * @return array The requested state.
	 */
	public static function get_state( $store_ns ) {
		return self::$initial_state[ $store_ns ] ?? array();
	}

	/**
	 * Merge data into the state with the given namespace.
	 *
	 * @param string $store_ns Namespace.
	 * @param array  $data      State to merge.
	 *
	 * @return void
	 */
	public static function merge_state( $store_ns, $data ) {
		self::$initial_state[ $store_ns ] = array_replace_recursive(
			self::get_state( $store_ns ),
			$data
		);
	}

	/**
	 * Get store data.
	 *
	 * @return array
	 */
	public static function get_data() {
		return self::$initial_state;
	}

	/**
	 * Reset the initial state.
	 */
	public static function reset() {
		self::$initial_state = array();
	}

	/**
	 * Render the initial state.
	 */
	public static function render() {
		if ( empty( self::$initial_state ) ) {
			return;
		}
		echo sprintf(
			'<script id="wp-interactivity-initial-state" type="application/json">%s</script>',
			wp_json_encode( self::$initial_state, JSON_HEX_TAG | JSON_HEX_AMP )
		);
	}
}
