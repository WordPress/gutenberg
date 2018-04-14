<?php
/**
 * Blocks API: WP_Parsed_Block_Types_Registry class
 *
 * @package gutenberg
 * @since 2.7.0
 */

/**
 * Core class used for storing a list of block types present in the page being currently served
 * This list of blocks is populated while stripping block comments from the HTML.
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

		if ( ! is_string( $block_type ) ) {
			$message = __( 'Block type names must be strings.', 'gutenberg' );
			_doing_it_wrong( __METHOD__, $message, '2.6.0' );
			return false;
		}

		if ( preg_match( '/[A-Z]+/', $block_type ) ) {
			$message = __( 'Block type names must not contain uppercase characters.', 'gutenberg' );
			_doing_it_wrong( __METHOD__, $message, '2.6.0' );
			return false;
		}

		$name_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
		if ( ! preg_match( $name_matcher, $block_type ) ) {
			$message = __( 'Block type names must contain a namespace prefix. Example: my-plugin/my-custom-block-type', 'gutenberg' );
			_doing_it_wrong( __METHOD__, $message, '2.6.0' );
			return false;
		}

		if ( ! WP_Block_Type_Registry::get_instance()->is_registered( $block_type ) ) {
			// translators: 1: block name.
			$message = sprintf( __( 'Block type "%s" isn\'t registered yet.', 'gutenberg' ), $block_type );
			_doing_it_wrong( __METHOD__, $message, '0.1.0' );
			return false;
		}

		$this->block_types_in_current_page[] = $block_type;

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
