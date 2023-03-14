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

}
