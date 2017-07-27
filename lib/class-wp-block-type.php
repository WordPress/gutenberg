<?php
/**
 * Blocks API: WP_Block_Type class
 *
 * @package gutenberg
 * @since 0.6.0
 */

/**
 * Core class representing a block type.
 *
 * @since 0.6.0
 *
 * @see register_block_type()
 */
class WP_Block_Type {
	/**
	 * Block type key.
	 *
	 * @since 0.6.0
	 * @access public
	 * @var string
	 */
	public $name;

	/**
	 * Block type render callback.
	 *
	 * @since 0.6.0
	 * @access public
	 * @var callable
	 */
	public $render_callback;

	/**
	 * Constructor.
	 *
	 * Will populate object properties from the provided arguments.
	 *
	 * @since 0.6.0
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
	 * Renders the block type output for given attributes and content.
	 *
	 * @since 0.6.0
	 * @access public
	 *
	 * @param array       $attributes Optional. Block attributes. Default empty array.
	 * @param string|null $content    Optional. Raw block content, or null if none set. Default null.
	 * @return string Rendered block type output.
	 */
	public function render( $attributes = array(), $content = null ) {
		if ( ! is_callable( $this->render_callback ) ) {
			if ( ! $content ) {
				return '';
			}

			return $content;
		}

		return call_user_func( $this->render_callback, $attributes, $content );
	}

	/**
	 * Sets block type properties.
	 *
	 * @since 0.6.0
	 * @access public
	 *
	 * @param array|string $args Array or string of arguments for registering a block type.
	 */
	public function set_props( $args ) {
		$args = wp_parse_args( $args, array(
			'render_callback' => null,
		) );

		$args['name'] = $this->name;

		foreach ( $args as $property_name => $property_value ) {
			$this->$property_name = $property_value;
		}
	}
}
