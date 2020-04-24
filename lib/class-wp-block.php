<?php
/**
 * Blocks API: WP_Block class
 *
 * @package Gutenberg
 */

/**
 * Class representing a parsed instance of a block.
 */
class WP_Block {

	/**
	 * Name of block.
	 *
	 * @example "core/paragraph"
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Block type associated with the instance.
	 *
	 * @var WP_Block_Type
	 */
	public $block_type;

	/**
	 * Block context values.
	 *
	 * @var array
	 */
	public $context = array();

	/**
	 * All available context of the current hierarchy.
	 *
	 * @var array
	 * @access protected
	 */
	protected $available_context;

	/**
	 * Block attribute values.
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * List of inner blocks (of this same class)
	 *
	 * @var WP_Block[]
	 */
	public $inner_blocks = array();

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
	public $inner_content = array();

	/**
	 * Constructor.
	 *
	 * Populates object properties from the provided block instance argument.
	 *
	 * The given array of context values will not necessarily be available on
	 * the instance itself, but is treated as the full set of values provided by
	 * the block's ancestry. This is assigned to the private `available_context`
	 * property. Only values which are configured to consumed by the block via
	 * its registered type will be assigned to the block's `context` property.
	 *
	 * @param array                  $block             Array of parsed block properties.
	 * @param array                  $available_context Optional array of ancestry context values.
	 * @param WP_Block_Type_Registry $registry          Optional block type registry.
	 */
	public function __construct( $block, $available_context = array(), $registry = null ) {
		$this->name = $block['blockName'];

		if ( is_null( $registry ) ) {
			$registry = WP_Block_Type_Registry::get_instance();
		}

		$this->block_type = $registry->get_registered( $this->name );

		if ( ! empty( $block['attrs'] ) ) {
			$this->attributes = $block['attrs'];
		}

		if ( ! is_null( $this->block_type ) ) {
			$this->attributes = $this->block_type->prepare_attributes_for_render( $this->attributes );
		}

		$this->available_context = $available_context;

		if ( ! empty( $this->block_type->context ) ) {
			foreach ( $this->block_type->context as $context_name ) {
				if ( array_key_exists( $context_name, $this->available_context ) ) {
					$this->context[ $context_name ] = $this->available_context[ $context_name ];
				}
			}
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$child_context = $this->available_context;

			/* phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase */
			if ( ! empty( $this->block_type->providesContext ) ) {
				foreach ( $this->block_type->providesContext as $context_name => $attribute_name ) {
					if ( array_key_exists( $attribute_name, $this->attributes ) ) {
						$child_context[ $context_name ] = $this->attributes[ $attribute_name ];
					}
				}
			}
			/* phpcs:enable */

			$this->inner_blocks = array_map(
				function( $inner_block ) use ( $child_context, $registry ) {
					return new WP_Block( $inner_block, $child_context, $registry );
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
		global $post, $_experimental_block;

		$is_dynamic    = $this->name && null !== $this->block_type && $this->block_type->is_dynamic();
		$block_content = '';

		$index = 0;
		foreach ( $this->inner_content as $chunk ) {
			$block_content .= is_string( $chunk ) ?
				$chunk :
				$this->inner_blocks[ $index++ ]->render();
		}

		if ( $is_dynamic ) {
			$global_post         = $post;
			$global_block        = $_experimental_block;
			$_experimental_block = $this;
			$block_content       = (string) call_user_func( $this->block_type->render_callback, $this->attributes, $block_content );
			$_experimental_block = $global_block;
			$post                = $global_post;
		}

		return $block_content;
	}

}
