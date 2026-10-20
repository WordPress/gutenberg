<?php
/**
 * REST API: Gutenberg_REST_Installed_Theme_Patterns_Controller class
 *
 * @package gutenberg
 */

/**
 * Lists the patterns that installed themes, other than the active one, would
 * add if they were activated.
 *
 * The patterns are read from the `patterns` folder of each theme, the way
 * WordPress registers the active theme's patterns, without loading the theme.
 * Sites can have hundreds of themes installed, so one request lists them all.
 * Patterns that a theme registers in PHP or requests from the Pattern Directory
 * in its theme.json aren't included.
 */
class Gutenberg_REST_Installed_Theme_Patterns_Controller extends WP_REST_Block_Patterns_Controller {

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		parent::__construct();
		$this->rest_base = 'block-patterns/installed-theme-patterns';
	}

	/**
	 * Checks whether a given request has permission to read the patterns of
	 * installed themes.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( gutenberg_can_use_installed_theme_patterns() ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_view',
			__( 'Sorry, you are not allowed to view the patterns of other themes.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Retrieves the patterns of the other installed themes. Patterns the editor
	 * already offers, patterns hidden from the inserter and patterns an
	 * earlier theme already listed are left out.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$registry = WP_Block_Patterns_Registry::get_instance();
		$listed   = array();
		$response = array();

		foreach ( gutenberg_get_installed_theme_pattern_sources() as $theme ) {
			// While the theme's patterns load, functions like
			// get_template_directory_uri() point to the theme, so the files
			// the patterns use load from it.
			$use_theme = static function () use ( $theme ) {
				return 'template' === current_filter() ? $theme->get_template() : $theme->get_stylesheet();
			};
			add_filter( 'stylesheet', $use_theme, PHP_INT_MAX );
			add_filter( 'template', $use_theme, PHP_INT_MAX );

			// Patterns can include the theme's other patterns, which are
			// resolved from the registry, so they're registered while the
			// theme's patterns are prepared.
			$registered = $this->register_theme_patterns( $theme );
			$patterns   = array();
			foreach ( $registered as $name => $file_path ) {
				if ( isset( $listed[ $name ] ) || ! $this->is_in_theme_folder( $file_path, $theme ) ) {
					continue;
				}
				$pattern = $this->get_registered_pattern( $name );
				if ( $pattern && ( $pattern['inserter'] ?? true ) ) {
					$patterns[] = $pattern;
				}
			}

			/**
			 * Filters the patterns that an installed theme, other than the
			 * active one, offers in the editor.
			 *
			 * To skip a theme entirely, or every theme, use the
			 * `should_load_installed_theme_block_patterns` filter instead.
			 *
			 * @param array[]  $patterns The patterns, with their `name`, `content`
			 *                           and the properties they were registered
			 *                           with. See register_block_pattern().
			 * @param WP_Theme $theme    The theme the patterns come from.
			 */
			$patterns = apply_filters( 'installed_theme_block_patterns', $patterns, $theme );

			foreach ( $patterns as $pattern ) {
				$prepared = $this->prepare_theme_pattern( $pattern, $theme, $request );
				if ( $prepared ) {
					$listed[ $pattern['name'] ] = true;
					$response[]                 = $prepared;
				}
			}

			foreach ( array_keys( $registered ) as $name ) {
				$registry->unregister( $name );
			}
			remove_filter( 'stylesheet', $use_theme, PHP_INT_MAX );
			remove_filter( 'template', $use_theme, PHP_INT_MAX );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Registers the patterns in the `patterns` folder of a theme and its
	 * parent, the way WordPress registers them for the active theme. Patterns
	 * with the name of a registered pattern are skipped.
	 *
	 * @param WP_Theme $theme The theme.
	 * @return string[] The file path of each registered pattern, by name.
	 */
	private function register_theme_patterns( $theme ) {
		$registry   = WP_Block_Patterns_Registry::get_instance();
		$registered = array();
		$themes     = $theme->parent() ? array( $theme, $theme->parent() ) : array( $theme );

		foreach ( $themes as $source ) {
			$folder = $source->get_stylesheet_directory() . '/patterns/';
			// Most themes have no patterns folder, which is quicker to check
			// than their cached list of patterns.
			if ( ! is_dir( $folder ) ) {
				continue;
			}
			$text_domain = $source->get( 'TextDomain' );

			foreach ( $source->get_block_patterns() as $file => $pattern ) {
				$file_path = $folder . $file;
				if ( $registry->is_registered( $pattern['slug'] ) || ! file_exists( $file_path ) ) {
					continue;
				}

				$pattern['filePath'] = $file_path;
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText,WordPress.WP.I18n.NonSingularStringLiteralDomain,WordPress.WP.I18n.LowLevelTranslationFunction
				$pattern['title'] = translate_with_gettext_context( $pattern['title'], 'Pattern title', $text_domain );
				if ( ! empty( $pattern['description'] ) ) {
					// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText,WordPress.WP.I18n.NonSingularStringLiteralDomain,WordPress.WP.I18n.LowLevelTranslationFunction
					$pattern['description'] = translate_with_gettext_context( $pattern['description'], 'Pattern description', $text_domain );
				}

				if ( $registry->register( $pattern['slug'], $pattern ) ) {
					$registered[ $pattern['slug'] ] = $file_path;
				}
			}
		}
		return $registered;
	}

	/**
	 * Returns whether a pattern file is in the theme's own folder, not in its
	 * parent's. The parent's patterns are listed with the parent.
	 *
	 * @param string   $file_path Absolute path of the pattern file.
	 * @param WP_Theme $theme     The theme.
	 * @return bool Whether the file is in the theme's folder.
	 */
	private function is_in_theme_folder( $file_path, $theme ) {
		return str_starts_with( $file_path, $theme->get_stylesheet_directory() . '/patterns/' );
	}

	/**
	 * Returns a registered pattern with its content. Loading the content runs
	 * the pattern's file, which belongs to a theme that isn't active, so a
	 * pattern whose file fails is left out.
	 *
	 * @param string $name Pattern name.
	 * @return array|null The pattern, or null if its file failed.
	 */
	private function get_registered_pattern( $name ) {
		$buffer_level = ob_get_level();
		try {
			return WP_Block_Patterns_Registry::get_instance()->get_registered( $name );
		} catch ( Throwable $error ) {
			while ( ob_get_level() > $buffer_level ) {
				ob_end_clean();
			}
			return null;
		}
	}

	/**
	 * Prepares a theme's pattern for the response, with the theme it comes
	 * from.
	 *
	 * @param array           $pattern The pattern.
	 * @param WP_Theme        $theme   The theme the pattern comes from.
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|null The prepared pattern, or null if it couldn't be prepared.
	 */
	private function prepare_theme_pattern( $pattern, $theme, $request ) {
		$buffer_level = ob_get_level();
		try {
			// Preparing resolves the patterns it includes, which can run more
			// of the theme's pattern files.
			$response = $this->prepare_item_for_response( $this->migrate_pattern_categories( $pattern ), $request );
		} catch ( Throwable $error ) {
			while ( ob_get_level() > $buffer_level ) {
				ob_end_clean();
			}
			return null;
		}

		$data = $this->prepare_response_for_collection( $response );

		// A pattern can include patterns that only load while its theme is
		// active, like the Pattern Directory patterns in its theme.json.
		// Inserting it would leave those out, so the pattern is left out.
		if ( isset( $data['content'] ) && str_contains( $data['content'], '<!-- wp:pattern ' ) ) {
			return null;
		}

		$fields = $this->get_fields_for_response( $request );
		if ( rest_is_field_included( 'theme', $fields ) ) {
			$data['theme'] = $theme->get_stylesheet();
		}
		if ( rest_is_field_included( 'theme_name', $fields ) ) {
			$data['theme_name'] = $theme->get( 'Name' );
		}
		return $data;
	}

	/**
	 * Retrieves the pattern schema, with the theme each pattern comes from.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema                             = parent::get_item_schema();
		$schema['properties']['theme']      = array(
			'description' => __( 'The stylesheet of the theme the pattern comes from.', 'gutenberg' ),
			'type'        => 'string',
			'readonly'    => true,
			'context'     => array( 'view', 'edit', 'embed' ),
		);
		$schema['properties']['theme_name'] = array(
			'description' => __( 'The name of the theme the pattern comes from.', 'gutenberg' ),
			'type'        => 'string',
			'readonly'    => true,
			'context'     => array( 'view', 'edit', 'embed' ),
		);

		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}
}
