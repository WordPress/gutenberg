<?php
/**
 * Block Serialization Parser
 *
 * @package WordPress
 */

/**
 * Class WP_Block_Parser_Block
 *
 * Holds the block structure in memory
 *
 * @since 3.8.0
 */
class WP_Block_Parser_Block {
	/**
	 * Name of block
	 *
	 * @example "core/paragraph"
	 *
	 * @since 3.8.0
	 * @var string
	 */
	public $block_name;

	/**
	 * Optional set of attributes from block comment delimiters
	 *
	 * @example null
	 * @example array( 'columns' => 3 )
	 *
	 * @since 3.8.0
	 * @var array|null
	 */
	public $attrs;

	/**
	 * List of inner blocks (of this same class)
	 *
	 * @since 3.8.0
	 * @var WP_Block_Parser_Block[]
	 */
	public $inner_blocks;

	/**
	 * Resultant HTML from inside block comment delimiters
	 * after removing inner blocks
	 *
	 * @example "...Just <!-- wp:test /--> testing..." -> "Just testing..."
	 *
	 * @since 3.8.0
	 * @var string
	 */
	public $inner_html;

	/**
	 * List of string fragments and null markers where inner blocks were found
	 *
	 * @example array(
	 *   'innerHTML'    => 'BeforeInnerAfter',
	 *   'innerBlocks'  => array( block, block ),
	 *   'innerContent' => array( 'Before', null, 'Inner', null, 'After' ),
	 * )
	 *
	 * @since 4.2.0
	 * @var array
	 */
	public $inner_content;

	/**
	 * Constructor.
	 *
	 * Will populate object properties from the provided arguments.
	 *
	 * @since 3.8.0
	 *
	 * @param string $name          Name of block.
	 * @param array  $attrs         Optional set of attributes from block comment delimiters.
	 * @param array  $inner_blocks  List of inner blocks (of this same class).
	 * @param string $inner_html    Resultant HTML from inside block comment delimiters after removing inner blocks.
	 * @param array  $inner_content List of string fragments and null markers where inner blocks were found.
	 */
	function __construct( $name, $attrs, $inner_blocks, $inner_html, $inner_content ) {
		$this->block_name    = $name;
		$this->attrs         = $attrs;
		$this->inner_blocks  = $inner_blocks;
		$this->inner_html    = $inner_html;
		$this->inner_content = $inner_content;
	}
}
