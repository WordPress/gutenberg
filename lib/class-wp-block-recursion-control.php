<?php
/**
 * Blocks API: WP_Block_Recursion_Control class
 *
 * @package Gutenberg
 */

/**
 * Class for detecting recursion in inner blocks.
 *
 * Implements the recursion control functions.
 * Blocks use the public API passing the unique ID and block name for their block.
 *
 * ```
 * if (  gutenberg_process_this_content( $id, $block_name ) ) {
 *  	$html = process the block;
 * 		gutenberg_clear_processed_content();
 * } else {
 * 		$html = gutenberg_report_recursion_error( $message, $class );
 * }
 * return $html;
 * ```
 *
 * Blocks wishing to report a recursion error should use
 * gutenberg_report_recursion_error( $message, $class )
 *
 * These functions will be implemented by methods accessed using WP_Block_Recursion_Control::get_instance()
 *
 * @property array $processed_content
 * @property integer|string $id
 * @property string $block_name
 */
class WP_Block_Recursion_Control {
	/**
	 * Stack of recursive blocks unique keys.
	 *
	 * @var array
	 *
	 */
	public $processed_content = [];

	/**
	 * ID of latest block. This could be the last straw.
	 */
	public $id;

	/**
	 * Block name of the latest block
	 */
	public $block_name;

	/**
	 * Container for the main instance of the class.
	 *
	 * @var WP_Block_Recursion_Control|null
	 */
	private static $instance = null;

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @since
	 *
	 * @return WP_Block_Recursion_Control The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Determines whether or not to process this content.
	 *
	 * @param string|integer $id Unique ID for the content
	 * @param string $block_name Block name e.g. core/post-content
	 * @return bool True if the post has not been processed. false otherwise
	 */
	function process_this_content( $id, $block_name ) {
		$this->id = $id;
		$this->block_name = $block_name;
		$processed = isset( $this->processed_content[ $id ] );
		if ( !$processed ) {
			$this->processed_content[$id] = "$block_name $id" ;
		}
		return !$processed;
	}

	/**
	 * Pops or clears the array of processed content.
	 *
	 * As we return to the previous level we can clear the processed content.
	 * Basically this is something we have to do while processing certain inner blocks:
	 *
	 * - core/post-content
	 * - core/template-part
	 * - core/post-excerpt - possibly
	 * - core/block - possibly
	 *
	 * Note: The top level is within the template, which loads the template parts and/or queries.
	 */
	function clear_processed_content() {
		array_pop( $this->processed_content );
	}

	/**
	 * Returns the unique ID of the last block.
	 *
	 * Used when a recursion error has been detected.
	 * @return int|string
	 */
	function get_id() {
		return $this->id;
	}

	/**
	 * Returns the block stack.
	 *
	 * Used when a recursion error has been detected.
	 * @return int|string
	 */
	function get_processed_content() {
		return $this->processed_content;
	}

	/**
	 * Returns the block name.
	 *
	 * Used when a recursion error has been detected.
	 * @return int|string
	 */
	function get_block_name() {
		return $this->block_name;
	}

}
