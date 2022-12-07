<?php
/**
 * API to update a theme.json structure.
 *
 * @package gutenberg
 */

/**
 * Class to update with a theme.json structure.
 */
class WP_Theme_JSON_Data_Gutenberg {

	/**
	 * Container of the data to update.
	 *
	 * @var WP_Theme_JSON
	 */
	private $theme_json = null;

	/**
	 * The origin of the data: default, theme, user, etc.
	 *
	 * @var string
	 */
	private $origin = '';

	/**
	 * Container for keep track of registered blocks.
	 *
	 * @since 6.1.0
	 * @var array
	 */
	protected static $blocks_cache = array(
		'core'   => array(),
		'blocks' => array(),
		'theme'  => array(),
		'user'   => array(),
	);

	/**
	 * Container for data coming from the blocks.
	 *
	 * @since 6.1.0
	 * @var WP_Theme_JSON
	 */
	protected static $blocks = null;

	/**
	 * Constructor.
	 *
	 * @param array  $data   Array following the theme.json specification.
	 * @param string $origin The origin of the data: default, theme, user.
	 */
	public function __construct( $data = array(), $origin = 'theme' ) {
		$this->origin     = $origin;
		$this->theme_json = new WP_Theme_JSON_Gutenberg( $data, $this->origin );
	}

	/**
	 * Updates the theme.json with the the given data.
	 *
	 * @param array $new_data Array following the theme.json specification.
	 *
	 * @return WP_Theme_JSON_Data_Gutenberg The own instance with access to the modified data.
	 */
	public function update_with( $new_data ) {
		$this->theme_json->merge( new WP_Theme_JSON_Gutenberg( $new_data, $this->origin ) );
		return $this;
	}

	/**
	 * Returns the underlying data.
	 *
	 * @return array
	 */
	public function get_data() {
		return $this->theme_json->get_raw_data();
	}

	/**
	 * Checks whether the registered blocks were already processed for this origin.
	 *
	 * @since 6.1.0
	 *
	 * @param string $origin Data source for which to cache the blocks.
	 *                       Valid values are 'core', 'blocks', 'theme', and 'user'.
	 * @return bool True on success, false otherwise.
	 */
	protected static function has_same_registered_blocks( $origin ) {
		// Bail out if the origin is invalid.
		if ( ! isset( static::$blocks_cache[ $origin ] ) ) {
			return false;
		}

		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = $registry->get_all_registered();

		// Is there metadata for all currently registered blocks?
		$block_diff = array_diff_key( $blocks, static::$blocks_cache[ $origin ] );
		if ( empty( $block_diff ) ) {
			return true;
		}

		foreach ( $blocks as $block_name => $block_type ) {
			static::$blocks_cache[ $origin ][ $block_name ] = true;
		}

		return false;
	}

}
