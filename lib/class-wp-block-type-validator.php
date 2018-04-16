<?php
/**
 * Blocks API: WP_Block_Type_Validator class
 *
 * @package gutenberg
 * @since 2.7.0
 */

/**
 * Core class used for validation of block type names
 *
 * @since 2.7.0
 */
class WP_Block_Type_Validator {

	/**
	 * A container (array) for storing errors encountered by the validator.
	 *
	 * Each error is itself an array with `error_text` and `added_from_version` keys.
	 *
	 * @var array $errors Array for storing errors encountered by the Validator
	 */
	private $errors = array();

	/**
	 * Validates a block type name
	 *
	 * @since 2.7.0
	 * @access public
	 *
	 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
	 *                                   complete WP_Block_Type instance.
	 * @return true|false                True on success, or false on failure.
	 */
	public function validate( $name ) {

		if ( $name instanceof WP_Block_Type ) {
			$name = $block_type->name;
		}

		if ( ! is_string( $name ) ) {
			$message = __( 'Block type names must be strings.', 'gutenberg' );
			$this->set_error( $message, '0.1.0' );

			return false;
		}

		if ( preg_match( '/[A-Z]+/', $name ) ) {
			$message = __( 'Block type names must not contain uppercase characters.', 'gutenberg' );
			$this->set_error( $message, '1.5.0' );

			return false;
		}

		$name_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
		if ( ! preg_match( $name_matcher, $name ) ) {
			$message = __( 'Block type names must contain a namespace prefix. Example: my-plugin/my-custom-block-type', 'gutenberg' );
			$this->set_error( $message, '0.1.0' );

			return false;
		}

		return true;
	}

	/**
	 * Set an error in the validator
	 *
	 * This function can be used to set an error in the Validator
	 * Please note that this function adds the error to the existing $this->errors array
	 * It does not flush the existing errors object
	 *
	 * @param string $error_text         A string denoting the error message.
	 * @param string $added_from_version A string denoting the version of WordPress where the error message was added.
	 */
	public function set_error( $error_text, $added_from_version = '' ) {
		$this->errors[] = array(
			'error_text'         => $error_text,
			'added_from_version' => $added_from_version,
		);
	}

	/**
	 * Checks if the Validator encountered any errors in validation
	 *
	 * This function checks $this->errors array and returns true if there are any errors in it.
	 * If yes, it returns true. If no, it returns false.
	 *
	 * @return bool True/False
	 */
	public function has_errors() {
		return ! empty( $this->errors ) ? true : false;
	}

	/**
	 * Get errors stored in the Validator
	 *
	 * This function returns the $this->errors array
	 *
	 * @return array An array is returned containing the errors stored in the Validator.
	 *               The returned array is an array of errors.
	 *               Each individual error is an array with `error_text` and `added_from_version` keys.
	 *               If there are no errors stored, an empty array is returned
	 */
	public function get_errors() {
		return $this->errors;
	}

	/**
	 * Get the last error encountered by the Validator
	 *
	 * @return array|bool An array containing `error_text` and `added_from_version` keys
	 *                    If there are no errors stored in the validator, FALSE (boolean) is returned
	 */
	public function get_last_error() {
		$error_count = count( $this->errors );

		if ( 0 === $error_count ) {
			return false;
		} else {
			return $this->errors[ $error_count - 1 ];
		}
	}
}
