<?php
/**
 * Blocks API: WP_Block class
 *
 * @package Gutenberg
 */

/**
 * Class representing a parsed instance of a block.
 */
class WP_Block implements ArrayAccess {

	/**
	 * Name of block.
	 *
	 * @example "core/paragraph"
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Block type context values.
	 *
	 * @var array
	 */
	public $context = [];

	/**
	 * Block type attribute values.
	 *
	 * @var array
	 */
	public $attributes = [];

	/**
	 * List of inner blocks (of this same class)
	 *
	 * @var WP_Block[]
	 */
	public $inner_blocks = [];

	/**
	 * Resultant HTML from inside block comment delimiters after removing inner
	 * blocks.
	 *
	 * @example "...Just <!-- wp:test /--> testing..." -> "Just testing..."
	 *
	 * @var string
	 */
	public $inner_html = '';

	/**
	 * List of string fragments and null markers where inner blocks were found
	 *
	 * @example array(
	 *   'inner_html'    => 'BeforeInnerAfter',
	 *   'inner_blocks'  => array( block, block ),
	 *   'inner_content' => array( 'Before', null, 'Inner', null, 'After' ),
	 * )
	 *
	 * @var array
	 */
	public $inner_content = [];

	/**
	 * Constructor.
	 *
	 * Populates object properties from the provided block instance argument.
	 *
	 * @param array $block Array of parsed block properties.
	 */
	public function __construct( $block ) {
		$this->name = $block['blockName'];

		if ( ! empty( $block['attrs'] ) ) {
			$this->attributes = $block['attrs'];
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$this->inner_blocks = array_map(
				function( $inner_block ) {
					return new WP_Block( $inner_block );
				},
				$block['innerBlocks']
			);
		}

		if ( ! empty( $block['innerHTML'] ) ) {
			$this->inner_html = $block['innerHTML'];
		}

		if ( ! empty( $block['innerContent'] ) ) {
			$this->inner_content = $block['innerContent'];
		}
	}

	/**
	 * Generates the render output for the block.
	 *
	 * @return string Rendered block output.
	 */
	public function render() {
		global $post, $_block_context;

		$block_type    = WP_Block_Type_Registry::get_instance()->get_registered( $this->name );
		$is_dynamic    = $this->name && null !== $block_type && $block_type->is_dynamic();
		$block_content = '';
		$index         = 0;

		$block_context_before = $_block_context;

		if ( ! isset( $_block_context ) ) {
			$_block_context = array();
		}

		if ( ! isset( $_block_context['postId'] ) || $post->ID !== $_block_context['postId'] ) {
			$_block_context['postId'] = $post->ID;
		}

		$prepared_attributes = $this->attributes;
		if ( ! is_null( $block_type ) ) {
			$prepared_attributes = $block_type->prepare_attributes_for_render( $this->attributes );
		}

		/* phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase */
		if ( ! empty( $block_type->providesContext ) && is_array( $block_type->providesContext ) ) {
			foreach ( $block_type->providesContext as $context_name => $attribute_name ) {
				if ( isset( $prepared_attributes[ $attribute_name ] ) ) {
					$_block_context[ $context_name ] = $prepared_attributes[ $attribute_name ];
				}
			}
		}
		/* phpcs:enable */

		if ( $is_dynamic ) {
			if ( isset( $block_type->context ) && is_array( $block_type->context ) ) {
				foreach ( $block_type->context as $context_name ) {
					if ( array_key_exists( $context_name, $_block_context ) ) {
						$this->context[ $context_name ] = $_block_context[ $context_name ];
					}
				}
			}

			$global_post   = $post;
			$block_content = (string) call_user_func( $block_type->render_callback, $this, $block_content );
			$post          = $global_post;
		} else {
			foreach ( $this->inner_content as $chunk ) {
				$block_content .= is_string( $chunk ) ?
					$chunk :
					$this->inner_blocks[ $index++ ]->render();
			}
		}

		$_block_context = $block_context_before;

		return $block_content;
	}

	/**
	 * Returns true if an attribute exists by the specified attribute name, or
	 * false otherwise.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetexists.php
	 *
	 * @param string $attribute_name Name of attribute to check.
	 *
	 * @return bool Whether attribute exists.
	 */
	public function offsetExists( $attribute_name ) {
		return isset( $this->attributes[ $attribute_name ] );
	}

	/**
	 * Returns the value by the specified attribute name.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetget.php
	 *
	 * @param string $attribute_name Name of attribute value to retrieve.
	 *
	 * @return mixed|null Attribute value if exists, or null.
	 */
	public function offsetGet( $attribute_name ) {
		return isset( $this->attributes[ $attribute_name ] ) ?
			$this->attributes[ $attribute_name ] :
			null;
	}

	/**
	 * Assign an attribute value by the specified attribute name.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetset.php
	 *
	 * @param string $attribute_name Name of attribute value to set.
	 * @param mixed  $value          Attribute value.
	 */
	public function offsetSet( $attribute_name, $value ) {
		if ( ! is_null( $attribute_name ) ) {
			$this->attributes[ $attribute_name ] = $value;
		}
	}

	/**
	 * Unset an attribute.
	 *
	 * @link https://www.php.net/manual/en/arrayaccess.offsetunset.php
	 *
	 * @param string $attribute_name Name of attribute value to unset.
	 */
	public function offsetUnset( $attribute_name ) {
		unset( $this->attributes[ $attribute_name ] );
	}

}
