<?php
/**
 * REST API: Gutenberg_REST_Installed_Theme_Patterns_Controller class
 *
 * @package gutenberg
 */

/**
 * Lists the patterns an installed theme, other than the active one, would add
 * if it were activated.
 *
 * Requests preview the theme with the `wp_theme_preview` query argument, so the
 * theme loads the way it would if it were active and patterns it registers in
 * PHP are included. The active theme doesn't load in these requests, which is
 * why only plugins can filter the patterns.
 */
class Gutenberg_REST_Installed_Theme_Patterns_Controller extends WP_REST_Block_Patterns_Controller {

	/**
	 * Pattern sources that don't depend on the theme. The editor already
	 * offers these patterns.
	 *
	 * @var string[]
	 */
	const THEME_INDEPENDENT_SOURCES = array( 'core', 'pattern-directory/core', 'pattern-directory/featured' );

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		parent::__construct();
		$this->rest_base = 'block-patterns/installed-theme-patterns';
	}

	/**
	 * Checks whether a given request has permission to read the patterns of
	 * installed themes. Loading them previews the theme, which needs the same
	 * permission as switching themes.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'switch_themes' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_view',
			__( 'Sorry, you are not allowed to view the patterns of other themes.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Retrieves the patterns the previewed theme adds.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$theme = wp_get_theme();

		// The preview falls back to the active theme for a theme it can't load.
		if ( get_option( 'stylesheet' ) === $theme->get_stylesheet() ) {
			return rest_ensure_response( array() );
		}

		// Patterns the theme requests from the Pattern Directory in theme.json.
		_register_remote_theme_patterns();

		$patterns = array();
		foreach ( WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $pattern ) {
			if ( in_array( $pattern['source'] ?? '', self::THEME_INDEPENDENT_SOURCES, true ) ) {
				continue;
			}
			$patterns[] = $this->migrate_pattern_categories( $pattern );
		}

		/**
		 * Filters the patterns that an installed theme, other than the active
		 * one, offers in the editor.
		 *
		 * The patterns load in a request that previews the theme, so the
		 * active theme's functions.php doesn't run and only plugins can use
		 * this filter. To skip a theme entirely, or every theme, use the
		 * `should_load_installed_theme_block_patterns` filter instead.
		 *
		 * The list also holds patterns that plugins register, which the editor
		 * already offers. Those are left out in the editor either way.
		 *
		 * @param array[]  $patterns The patterns, with their `name`, `content`
		 *                           and the properties they were registered
		 *                           with. See register_block_pattern().
		 * @param WP_Theme $theme    The theme the patterns come from.
		 */
		$patterns = apply_filters( 'installed_theme_block_patterns', $patterns, $theme );

		$response = array();
		foreach ( $patterns as $pattern ) {
			$prepared_pattern = $this->prepare_item_for_response( $pattern, $request );
			$response[]       = $this->prepare_response_for_collection( $prepared_pattern );
		}
		return rest_ensure_response( $response );
	}
}
