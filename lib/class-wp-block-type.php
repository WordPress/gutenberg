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
	 * Block type attributes property schemas.
	 *
	 * @since 0.10.0
	 * @access public
	 * @var array
	 */
	public $attributes;

	/**
	 * Block type editor script handle.
	 *
	 * @since 2.0.0
	 * @access public
	 * @var string
	 */
	public $editor_script;

	/**
	 * Block type front end script handle.
	 *
	 * @since 2.0.0
	 * @access public
	 * @var string
	 */
	public $script;

	/**
	 * Block type editor style handle.
	 *
	 * @since 2.0.0
	 * @access public
	 * @var string
	 */
	public $editor_style;

	/**
	 * Block type front end style handle.
	 *
	 * @since 2.0.0
	 * @access public
	 * @var string
	 */
	public $style;

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

		$attributes = $this->prepare_attributes_for_render( $attributes );

		return call_user_func( $this->render_callback, $attributes, $content );
	}

	/**
	 * Validates attributes against the current block schema, populating
	 * defaulted and missing values, and omitting unknown attributes.
	 *
	 * @param  array $attributes Original block attributes.
	 * @return array             Prepared block attributes.
	 */
	public function prepare_attributes_for_render( $attributes ) {
		if ( ! isset( $this->attributes ) ) {
			return $attributes;
		}

		$prepared_attributes = array();

		foreach ( $this->attributes as $attribute_name => $schema ) {
			$value = null;

			if ( isset( $attributes[ $attribute_name ] ) ) {
				$is_valid = rest_validate_value_from_schema( $attributes[ $attribute_name ], $schema );
				if ( ! is_wp_error( $is_valid ) ) {
					$value = $attributes[ $attribute_name ];
				}
			}

			if ( is_null( $value ) && isset( $schema['default'] ) ) {
				$value = $schema['default'];
			}

			$prepared_attributes[ $attribute_name ] = $value;
		}

		return $prepared_attributes;
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
