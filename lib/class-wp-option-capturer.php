<?php
/**
 * A helper class for capturing option updates. This was extracted from
 * WP_Customize_Widgets. When merged to Core, WP_Customize_Widgets should be
 * updated to compose this class.

 * @package gutenberg
 */

/**
 * Utility class used to capture option updates.
 */
class WP_Option_Capturer {
	/**
	 * List of captured widget option updates.
	 *
	 * @since 10.2.0
	 * @var array $_captured_options Values updated while option capture is happening.
	 */
	protected $_captured_options = array();

	/**
	 * Whether option capture is currently happening.
	 *
	 * @since 10.2.0
	 * @var bool $_is_current Whether option capture is currently happening or not.
	 */
	protected $_is_capturing_option_updates = false;

	/**
	 * Determines whether the captured option update should be ignored.
	 *
	 * @since 10.2.0
	 *
	 * @param string $option_name Option name.
	 * @return bool Whether the option capture is ignored.
	 */
	protected function is_option_capture_ignored( $option_name ) {
		return ( 0 === strpos( $option_name, '_transient_' ) );
	}

	/**
	 * Retrieves captured widget option updates.
	 *
	 * @since 10.2.0
	 *
	 * @return array Array of captured options.
	 */
	public function get_captured_options() {
		return $this->_captured_options;
	}

	/**
	 * Retrieves the option that was captured from being saved.
	 *
	 * @since 10.2.0
	 *
	 * @param string $option_name Option name.
	 * @param mixed  $default     Optional. Default value to return if the option does not exist. Default false.
	 * @return mixed Value set for the option.
	 */
	public function get_captured_option( $option_name, $default = false ) {
		if ( array_key_exists( $option_name, $this->_captured_options ) ) {
			$value = $this->_captured_options[ $option_name ];
		} else {
			$value = $default;
		}
		return $value;
	}

	/**
	 * Retrieves the number of captured widget option updates.
	 *
	 * @since 10.2.0
	 *
	 * @return int Number of updated options.
	 */
	public function count_captured_options() {
		return count( $this->_captured_options );
	}

	/**
	 * Begins keeping track of changes to widget options, caching new values.
	 *
	 * @since 10.2.0
	 */
	public function start_capturing_option_updates() {
		if ( $this->_is_capturing_option_updates ) {
			return;
		}

		$this->_is_capturing_option_updates = true;

		add_filter( 'pre_update_option', array( $this, 'capture_filter_pre_update_option' ), 10, 3 );
	}

	/**
	 * Pre-filters captured option values before updating.
	 *
	 * @since 10.2.0
	 *
	 * @param mixed  $new_value   The new option value.
	 * @param string $option_name Name of the option.
	 * @param mixed  $old_value   The old option value.
	 * @return mixed Filtered option value.
	 */
	public function capture_filter_pre_update_option( $new_value, $option_name, $old_value ) {
		if ( $this->is_option_capture_ignored( $option_name ) ) {
			return $new_value;
		}

		if ( ! isset( $this->_captured_options[ $option_name ] ) ) {
			add_filter( "pre_option_{$option_name}", array( $this, 'capture_filter_pre_get_option' ) );
		}

		$this->_captured_options[ $option_name ] = $new_value;

		return $old_value;
	}

	/**
	 * Pre-filters captured option values before retrieving.
	 *
	 * @since 10.2.0
	 *
	 * @param mixed $value Value to return instead of the option value.
	 * @return mixed Filtered option value.
	 */
	public function capture_filter_pre_get_option( $value ) {
		$option_name = preg_replace( '/^pre_option_/', '', current_filter() );

		if ( isset( $this->_captured_options[ $option_name ] ) ) {
			$value = $this->_captured_options[ $option_name ];

			/** This filter is documented in wp-includes/option.php */
			$value = apply_filters( 'option_' . $option_name, $value, $option_name );
		}

		return $value;
	}

	/**
	 * Undoes any changes to the options since options capture began.
	 *
	 * @since 10.2.0
	 */
	public function stop_capturing_option_updates() {
		if ( ! $this->_is_capturing_option_updates ) {
			return;
		}

		remove_filter( 'pre_update_option', array( $this, 'capture_filter_pre_update_option' ), 10 );

		foreach ( array_keys( $this->_captured_options ) as $option_name ) {
			remove_filter( "pre_option_{$option_name}", array( $this, 'capture_filter_pre_get_option' ) );
		}

		$this->_captured_options            = array();
		$this->_is_capturing_option_updates = false;
	}
}
