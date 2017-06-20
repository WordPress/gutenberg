<?php
/**
 * Blocks API: WP_Block_Type class
 *
 * @package gutenberg
 * @since 0.2.0
 */

/**
 * Core class representing a block type.
 *
 * @since 0.2.0
 *
 * @see register_block_type()
 */
final class WP_Block_Type {
	/**
	 * Block type key.
	 *
	 * @since 0.2.0
	 * @access public
	 * @var string
	 */
	public $name;

	/**
	 * Block type render callback.
	 *
	 * @since 0.2.0
	 * @access public
	 * @var callable
	 */
	public $render;

	/**
	 * Constructor.
	 *
	 * Will populate object properties from the provided arguments.
	 *
	 * @since 0.2.0
	 * @access public
	 *
	 * @see register_block_type()
	 *
	 * @param string       $block_type Block type name including namespace.
	 * @param array|string $args       Optional. Array or string of arguments for registering a block type.
	 *                                 Default empty array.
	 */
	public function __construct( $block_type, $args = array() ) {
		$this->name = $block_type;

		$this->set_props( $args );
	}

	/**
	 * Sets block type properties.
	 *
	 * @since 0.2.0
	 * @access public
	 *
	 * @param array|string $args Array or string of arguments for registering a block type.
	 */
	public function set_props( $args ) {
		$args = wp_parse_args( $args );

		/**
		 * Filters the arguments for registering a block type.
		 *
		 * @since 0.2.0
		 *
		 * @param array  $args       Array of arguments for registering a block type.
		 * @param string $block_type Block type key.
		 */
		$args = apply_filters( 'register_block_type_args', $args, $this->name );

		$defaults = array(
			'render' => null,
		);

		$args = array_merge( $defaults, $args );

		$args['name'] = $this->name;

		foreach ( $args as $property_name => $property_value ) {
			$this->$property_name = $property_value;
		}
	}
}
