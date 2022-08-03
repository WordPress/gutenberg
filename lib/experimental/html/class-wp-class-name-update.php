<?php
/**
 * HTML Walker: Class name update class.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.1.0
 */

/**
 * Data structure used for class name update operations.
 *
 * @since 6.1.0
 *
 * @see WP_HTML_Walker
 */
class WP_Class_Name_Update {
	/**
	 * Class name removal.
	 *
	 * @since 6.1.0
	 */
	const REMOVE = false;

	/**
	 * Class name addition.
	 *
	 * @since 6.1.0
	 */
	const ADD = true;

	/**
	 * The name of the class.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	public $class_name;

	/**
	 * Type of the operation.
	 *
	 * @since 6.1.0
	 * @var boolean
	 */
	public $type;

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 *
	 * @param string $class_name The name of the class.
	 * @param bool   $operation  Type of the operation.
	 */
	public function __construct( $class_name, $operation ) {
		$this->class_name = $class_name;
		$this->type       = $operation;
	}
}
