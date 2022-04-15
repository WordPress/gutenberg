<?php
/**
 * REST API: WP_REST_Edit_Site_Export_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoint for exporting current templates
 * and template parts.
 *
 * @since 5.9.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Edit_Site_Export_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = 'wp-block-editor/v1';
		$this->rest_base = 'export';
	}

	/**
	 * Registers the necessary REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'export' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			),
			true // Override core route if already exists (WP 5.9).
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/update_theme',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'update_theme' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			),
			true
		);
	}

	/**
	 * Checks whether a given request has permission to export.
	 *
	 * @return WP_Error|bool True if the request has access, or WP_Error object.
	 */
	public function permissions_check() {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_export_templates',
			__( 'Sorry, you are not allowed to export templates and template parts.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Output a ZIP file with an export of the current templates
	 * template parts, theme.json and index.php from the site editor,
	 * and close the connection.
	 *
	 * @return WP_Error|void
	 */
	public function export() {
		// Generate the export file.
		$filename = gutenberg_generate_block_templates_export_file();

		if ( is_wp_error( $filename ) ) {
			$filename->add_data( array( 'status' => 500 ) );

			return $filename;
		}

		$theme_name = wp_get_theme()->get( 'TextDomain' );
		header( 'Content-Type: application/zip' );
		header( 'Content-Disposition: attachment; filename=' . $theme_name . '.zip' );
		header( 'Content-Length: ' . filesize( $filename ) );
		flush();
		readfile( $filename );
		unlink( $filename );
		exit;
	}

	/**
	 * Update the files of a block theme with the template customisations
	 * made in the site editor.
	 *
	 * @return WP_Error|void
	 */
	public function update_theme() {
		$this->blockbase_save_theme();
		return rest_ensure_response(  array( "update_theme" => true ) );
	}


	function blockbase_save_theme() {

		if ( is_child_theme() ) {
			$this->save_theme_locally( 'current' );
		}
		else {
			$this->save_theme_locally( 'all' );
		}
		$this->clear_user_customizations();

	}

	function save_theme_locally( $export_type ) {
		$this->add_templates_to_local( $export_type );
		$this->add_theme_json_to_local( $export_type );
	}

	function clear_user_customizations() {

		// Clear all values in the user theme.json
		$user_custom_post_type_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
		$global_styles_controller = new Gutenberg_REST_Global_Styles_Controller();
		$update_request = new WP_REST_Request( 'PUT', '/wp/v2/global-styles/' );
		$update_request->set_param( 'id', $user_custom_post_type_id );
		$update_request->set_param( 'settings', [] );
		$update_request->set_param( 'styles', [] );
		$updated_global_styles = $global_styles_controller->update_item( $update_request );
		delete_transient( 'global_styles' );
		delete_transient( 'global_styles_' . get_stylesheet() );
		delete_transient( 'gutenberg_global_styles' );
		delete_transient( 'gutenberg_global_styles_' . get_stylesheet() );

		//remove all user templates (they have been saved in the theme)
		$templates = gutenberg_get_block_templates();
		$template_parts = gutenberg_get_block_templates( array(), 'wp_template_part' );
		foreach ( $template_parts as $template ) {
			if ( $template->source !== 'custom' ) {
				continue;
			}
			wp_delete_post($template->wp_id, true);
		}

		foreach ( $templates as $template ) {
			if ( $template->source !== 'custom' ) {
				continue;
			}
			wp_delete_post($template->wp_id, true);
		}

	}

	/*
	 * Filter a template out (return false) based on the export_type expected and the templates origin.
	 * Templates not filtered out are modified based on the slug information provided and cleaned up
	 * to have the expected exported value.
	 */
	function filter_theme_template( $template, $export_type, $path, $old_slug, $new_slug ) {
		if ($template->source === 'theme' && $export_type === 'user') {
			return false;
		}
		if (
			$template->source === 'theme' &&
			$export_type === 'current' &&
			! file_exists( $path . $template->slug . '.html' )
		) {
			return false;
		}

		$template->content = _remove_theme_attribute_in_block_template_content( $template->content );

		// NOTE: Dashes are encoded as \u002d in the content that we get (noteably in things like css variables used in templates)
		// This replaces that with dashes again. We should consider decoding the entire string but that is proving difficult.
		$template->content = str_replace( '\u002d', '-', $template->content );

		if ( $new_slug ) {
			$template->content = str_replace( $old_slug, $new_slug, $template->content );
		}

		return $template;
	}

	function get_theme_templates( $export_type, $new_slug ) {

		$old_slug = wp_get_theme()->get( 'TextDomain' );
		$templates = gutenberg_get_block_templates();
		$template_parts = gutenberg_get_block_templates ( array(), 'wp_template_part' );
		$exported_templates = [];
		$exported_parts = [];

		// build collection of templates/parts in currently activated theme
		$templates_paths = get_block_theme_folders();
		$templates_path =  get_stylesheet_directory() . '/' . $templates_paths['wp_template'] . '/';
		$parts_path =  get_stylesheet_directory() . '/' . $templates_paths['wp_template_part'] . '/';

		foreach ( $templates as $template ) {
			$template = $this->filter_theme_template(
				$template,
				$export_type,
				$templates_path,
				$old_slug,
				$new_slug
			);
			if ( $template ) {
				$exported_templates[] = $template;
			}
		}

		foreach ( $template_parts as $template ) {
			$template = $this->filter_theme_template(
				$template,
				$export_type,
				$parts_path,
				$old_slug,
				$new_slug

			);
			if ( $template ) {
				$exported_parts[] = $template;
			}
		}

		return (object)[
			'templates'=>$exported_templates,
			'parts'=>$exported_parts
		];

	}

	function add_templates_to_local( $export_type ) {

		$theme_templates = $this->get_theme_templates( $export_type, null );

		foreach ( $theme_templates->templates as $template ) {
			file_put_contents(
				get_template_directory() . '/templates/' . $template->slug . '.html',
				$template->content
			);
		}

		foreach ( $theme_templates->parts as $template_part ) {
			file_put_contents(
				get_template_directory() . '/parts/' . $template_part->slug . '.html',
				$template_part->content
			);
		}
	}

	function add_theme_json_to_local ( $export_type ) {
		file_put_contents(
			get_template_directory() . '/theme.json',
			MY_Theme_JSON_Resolver::export_theme_data( $export_type )
		);
	}
}

class MY_Theme_JSON_Resolver extends WP_Theme_JSON_Resolver {

	/**
	 * 'Flatten' theme data that expresses both theme and user data.
	 * change property.[custom|theme].value to property.value
	 * Uses custom value if available, otherwise theme value
	 * I feel like there should be a function to do this in Gutenberg but I couldn't find it
	 */
	private static function flatten_theme_json( $data, $name ) {
		if ( is_array( $data ) ) {

			// 'settings' can have a 'custom' object that is different and should not be processed in the same way
			// as values that could be represented as both theme and user (user data being 'custom')
			if ( $name !== 'settings' ) {

				// When there is BOTH custom AND THEME combine the two
				if ( array_key_exists( 'custom', $data ) && array_key_exists( 'theme', $data ) ) {
					$merged = array_merge( $data['custom'], $data['theme'] );
					// eliminate values with duplicate slugs
					// TODO: This could probably be done better...
					$filtered = array();
					$sluglist = array();
					foreach ( $merged as $item ) {
						if( array_key_exists('slug', $item) ) {
							if( ! in_array($item['slug'], $sluglist) ) {
								$sluglist[] = $item['slug'];
								$filtered[] = $item;
							}
						}
						else {
							$filtered[] = $item;
						}
					}
					return MY_Theme_JSON_Resolver::flatten_theme_json($filtered, $name);
				}

				// When there is CUSTOM but no THEME return custom
				if ( array_key_exists( 'custom', $data ) ) {
					return MY_Theme_JSON_Resolver::flatten_theme_json($data['custom'], $name);
				}

				// When there is THEME but no CUSTOM return theme
				if ( array_key_exists( 'theme', $data ) ) {
					return MY_Theme_JSON_Resolver::flatten_theme_json($data['theme'], $name);
				}

			}

			foreach( $data as $node_name => $node_value  ) {
				$data[ $node_name ] = MY_Theme_JSON_Resolver::flatten_theme_json( $node_value, $node_name );
			}
		}

		return $data;
	}

	/**
	 * Export the combined (and flattened) THEME and CUSTOM data.
	 *
	 * @param string $content ['all', 'current', 'user'] Determines which settings content to include in the export.
	 * All options include user settings.
	 * 'current' will include settings from the currently installed theme but NOT from the parent theme.
	 * 'all' will include settings from the current theme as well as the parent theme (if it has one)
	 */
	public static function export_theme_data( $content ) {
		$theme = new WP_Theme_JSON();

		if ( $content === 'all' && wp_get_theme()->parent() ) {
			// Get parent theme.json.
			$parent_theme_json_data = static::read_json_file( static::get_file_path_from_theme( 'theme.json', true ) );
			$parent_theme_json_data = static::translate( $parent_theme_json_data, wp_get_theme()->parent()->get( 'TextDomain' ) );
			$parent_theme           = new WP_Theme_JSON( $parent_theme_json_data );
			$theme->merge ($parent_theme);
		}

		if ( $content === 'all' || $content === 'current' ) {
			$theme_json_data = static::read_json_file( static::get_file_path_from_theme( 'theme.json' ) );
			$theme_json_data = static::translate( $theme_json_data, wp_get_theme()->get( 'TextDomain' ) );
			$theme_theme     = new WP_Theme_JSON( $theme_json_data );
			 $theme->merge( $theme_theme );
		}

		$theme->merge( static::get_user_data() );

		$data = MY_Theme_JSON_Resolver::flatten_theme_json($theme->get_raw_data(), null);

		$theme_json = wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		return preg_replace ( '~(?:^|\G)\h{4}~m', "\t", $theme_json );

	}

}
