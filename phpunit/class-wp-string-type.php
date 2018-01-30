<?php
/**
 * WP_String_Type for testing
 *
 * @package Gutenberg
 */

/**
 * Test class implementing __toString()
 */
class WP_String_Type {

	/**
	 * @var string
	 */
	private $value;

	/**
	 * Constructor.
	 *
	 * @param string $value Value for string representation.
	 */
	public function __construct( $value ) {

		$this->value = (string) $value;
	}

	public function __toString() {
		return $this->value;
	}
}
