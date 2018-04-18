<?php
/**
 * Blocks API: WP_Parsed_Block_Types_Registry class
 *
 * @package gutenberg
 * @since 2.7.0
 */

/**
 * Core class used for storing a list of `block types` present in the currently requested post / page.
 * This list of `block types` is populated while stripping block comments from the post's HTML.
 *
 * This registry is later used for intelligent enqueueing of front-end styles (enqueue front-end styles
 * for only `block types` present in the currently requested post / page)
 *
 * This registry is only populated if the current queried object is a a single post / page.
 * For pages containing multiple posts like `category / archive / home page`, this registry isn't populated
 * since we don't need to enqueue front-end styles on these pages intelligently.
 *
 * @package gutenberg
 * @since 2.6.0
 */
class WP_Parsed_Block_Types_Registry {

	/**
	 * Blocks type present in the page being current served, as an array of block type names (strings)
	 *
	 * @since 2.6.0
	 * @access private
	 * @var array
	 */
	private $block_types_in_current_page = array();

	/**
	 * Container for the main instance of the class.
	 *
	 * @since 2.6.0
	 * @access private
	 * @static
	 * @var WP_Parsed_Block_Types_Registry|null
	 */
	private static $instance = null;

	/**
	 * This function adds the block type to the $block_types_in_current_page array
	 * after doing some necessary validations
	 *
	 * @since 2.6.0
	 * @access public
	 *
	 * @param string|WP_Block_Type $block_type Block type name including namespace, or alternatively a
	 *                                         complete WP_Block_Type instance.
	 * @return true|false                      True on success, or false on failure.
	 */
	public function add( $block_type ) {

		if ( $block_type instanceof WP_Block_Type ) {
			$block_type = $block_type->name;
		}

		$block_type_validator = new WP_Block_Type_Validator();
		$is_block_type_valid  = $block_type_validator->validate( $block_type );

		if ( ! $is_block_type_valid ) {
			$error = $block_type_validator->get_last_error();
+			_doing_it_wrong( __METHOD__, $error['error_text'], $error['added_from_version'] );

			return false;
		}

		if ( ! WP_Block_Type_Registry::get_instance()->is_registered( $block_type ) ) {
			// translators: 1: block name.
			$message = sprintf( __( 'Block type "%s" isn\'t registered yet.', 'gutenberg' ), $block_type );
			_doing_it_wrong( __METHOD__, $message, '0.1.0' );
			return false;
		}

		if ( ! in_array( $block_type, $this->block_types_in_current_page ) ) {
			array_push( $this->block_types_in_current_page, $block_type );
		}

		return true;
	}

	/**
	 * Retrieves all block types present in the web page being currently served
	 *
	 * @since 2.6.0
	 * @access public
	 *
	 * @return array Array of block types present on the web page being currently served (As an array of strings)
	 */
	public function get_block_types_in_current_page() {
		return $this->block_types_in_current_page;
	}

	/**
	 * Checks if a block type is present on the current web page
	 *
	 * @since 2.6.0
	 * @access public
	 *
	 * @param string $block_type Block type name including namespace.
	 * @return bool              True if the block type is present, false otherwise.
	 */
	public function is_block_type_present_on_current_page( $block_type ) {
		return isset( $this->block_types_in_current_page[ $block_type ] );
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @since 2.6.0
	 * @access public
	 * @static
	 *
	 * @return WP_Parsed_Block_Types_Registry The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}
