<?php
/**
 * REST API: WP_REST_Edit_Site_Export_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoints for exporting current templates
 * and template parts either as a zip bundle or as edits to the current enabled
 * theme's files.
 *
 * @since 5.9.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Edit_Site_Export_Controller_6_1 extends Gutenberg_REST_Edit_Site_Export_Controller {


	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/export_to_theme_files',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'export_to_theme_files' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			),
			true
		);

		parent::register_routes();
	}

	/**
	 * Update the files of the currently enabled block theme with the template and
	 * template part customisations and additions made in the site editor.
	 *
	 * @return WP_Error|void
	 */
	public function export_to_theme_files() {
		try {
			$this->update_template_and_parts_files();
			$this->update_theme_json_file();
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_cant_update_theme_files', __( 'Error updating theme files. ', 'gutenberg' ) . $e->getMessage(), array( 'status' => 500 ) );
		}

		$this->clear_user_customizations();
		return rest_ensure_response(  array( "theme_files_updated" => true ) );


	}

	protected function update_template_and_parts_files() {

		$user_customisations = $this->get_user_customisations();

		foreach ( $user_customisations['templates'] as $template ) {
			$fileToUpdate = get_template_directory() . '/templates/' .
				$template->slug . '.html';
			if ( ! file_exists( $fileToUpdate ) ) {
				throw new Exception("Theme file does not exist: " . $fileToUpdate);
			}
			if ( ! wp_is_writable( $fileToUpdate ) ) {
				throw new Exception("Theme file is not writeable: " . $fileToUpdate);
			}
			file_put_contents(
				$fileToUpdate,
				$template->content
			);
		}

		foreach ( $user_customisations['template_parts'] as $template_part ) {
			$fileToUpdate = get_template_directory() . '/parts/' .
				$template_part->slug . '.html';
			if ( ! file_exists( $fileToUpdate ) ) {
				throw new Exception("Theme file does not exist: " . $fileToUpdate);
			}
			if ( ! wp_is_writable( $fileToUpdate ) ) {
				throw new Exception("Theme file is not writeable: " . $fileToUpdate);
			}
			file_put_contents(
				$fileToUpdate,
				$template_part->content
			);
		}
	}

	protected function update_theme_json_file() {
		$fileToUpdate = get_template_directory() . '/theme.json';
		if ( ! file_exists( $fileToUpdate ) ) {
			throw new Exception("Theme file does not exist: " . $fileToUpdate);
		}
		if ( ! wp_is_writable( $fileToUpdate ) ) {
			throw new Exception("Theme file is not writeable: " . $fileToUpdate);
		}
		file_put_contents(
			$fileToUpdate,
			gutenberg_export_theme_json()
		);
	}

	protected function get_user_customisations() {

		$templates = gutenberg_get_block_templates();
		$template_parts = gutenberg_get_block_templates ( array(), 'wp_template_part' );

		$exported_templates = [];
		$exported_template_parts = [];

		foreach ( $templates as $template ) {
			if ( $template->source !== 'custom' ) {
				continue;
			}
			$template = $this->clean_template( $template );
			$exported_templates[] = $template;
		}

		foreach ( $template_parts as $template_part ) {
			if ( $template_part->source !== 'custom' ) {
				continue;
			}
			$template_part = $this->clean_template( $template_part );
			$exported_template_parts[] = $template_part;
		}

		return array(
			'templates'=>$exported_templates,
			'template_parts'=>$exported_template_parts
		);

	}

	/*
	 * Clean a template or template part by reversing unicode escaping
	 * and removing the theme attribute from the content
	 */
	function clean_template( $template ) {
		$template->content = _remove_theme_attribute_in_block_template_content(
			$template->content
		);

		// `serialize_block_attributes` has "unicode escape sequence
 		// substitution for characters which might otherwise interfere with embedding
 		// the result in an HTML comment".
		// This reverses that escaping for saving back to files.
		// @see `wp-includes/blocks.php`
		$template->content = str_replace( '\\u002d\\u002d', '--', $template->content );
		$template->content = str_replace( '\\u003c', '<', $template->content );
		$template->content = str_replace( '\\u003e', '>', $template->content );
		$template->content = str_replace( '\\u0026', '&', $template->content );
		$template->content = str_replace( '\\u0022', '"', $template->content );

		return $template;
	}

	function clear_user_customizations() {

		// clear global styles
		$global_styles_controller = new Gutenberg_REST_Global_Styles_Controller();
		$update_request = new WP_REST_Request( 'PUT', '/wp/v2/global-styles/' );
		$update_request->set_param(
			'id',
			WP_Theme_JSON_Resolver::get_user_global_styles_post_id()
		);
		$update_request->set_param( 'settings', [] );
		$update_request->set_param( 'styles', [] );
		$global_styles_controller->update_item( $update_request );

		// delete global styles transients
		delete_transient( 'global_styles' );
		delete_transient( 'global_styles_' . get_stylesheet() );
		delete_transient( 'gutenberg_global_styles' );
		delete_transient( 'gutenberg_global_styles_' . get_stylesheet() );

		// remove all user templates and template parts
		$user_customisations = $this->get_user_customisations();
		foreach ( $user_customisations['templates'] as $template ) {
			wp_delete_post($template->wp_id, true);
		}
		foreach ( $user_customisations['template_parts'] as $template_part ) {
			wp_delete_post($template->wp_id, true);
		}
	}
}
