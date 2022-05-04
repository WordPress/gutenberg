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

	protected $user_customisations = [];
	protected $theme_file_path = '';

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
	 * Checks whether the user has permission to edit themes. In classic themes
	 * this controls access to Appearance > Theme Editor to edit theme files.
	 * In block themes editing theme files via the visual editor is similar.
	 *
	 * @return WP_Error|bool True if the request has access, or WP_Error object.
	 */
	public function permissions_check() {
		if ( current_user_can( 'edit_themes' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_edit_theme',
			__( 'Sorry, you are not allowed to edit theme templates and template parts.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Update the files of the currently enabled block theme with the template and
	 * template part customisations and additions made in the site editor.
	 *
	 * @return WP_Error|void
	 */
	public function export_to_theme_files() {
		try {
			$this->ensure_writeable_theme_folders();
			$this->check_writeable_theme_files();
			$this->update_template_and_parts_files();
			$this->update_theme_json_file();
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_error_updating_theme', __( 'Error updating theme files. ', 'gutenberg' ) . $e->getMessage(), array( 'status' => 500 ) );
		}

		$this->clear_user_customizations();
		return rest_ensure_response(  array( "theme_files_updated" => true ) );
	}

	protected function ensure_writeable_theme_folders() {
		$user_customisations = $this->get_user_customisations();

		foreach ( $user_customisations['templates'] as $template ) {
			$fileToUpdateFolder = get_theme_file_path() . '/templates/';
			if( ! wp_mkdir_p( $fileToUpdateFolder ) ) {
				throw new Exception("Theme was not changed. Could not create: " . $fileToUpdateFolder);
			}
		}

		foreach ( $user_customisations['template_parts'] as $template_part ) {
			$fileToUpdateFolder = get_theme_file_path() . '/parts/';
			if( ! wp_mkdir_p( $fileToUpdateFolder ) ) {
				throw new Exception("Theme was not changed. Could not create: " . $fileToUpdateFolder);
			}
		}

	}

	protected function check_writeable_theme_files() {

		$user_customisations = $this->get_user_customisations();

		foreach ( $user_customisations['templates'] as $template ) {
			$fileToUpdateFolder = get_theme_file_path() . '/templates/';
			$fileToUpdate = $fileToUpdateFolder .
				$template->slug . '.html';
			if ( file_exists( $fileToUpdate ) && ! wp_is_writable( $fileToUpdate ) ) {
				throw new Exception("Theme was not changed. Theme file is not writeable: " . $fileToUpdate);
			}
		}

		foreach ( $user_customisations['template_parts'] as $template_part ) {
			$fileToUpdateFolder = get_theme_file_path() . '/parts/';
			$fileToUpdate = $fileToUpdateFolder .
				$template_part->slug . '.html';
			if ( file_exists( $fileToUpdate ) && ! wp_is_writable( $fileToUpdate ) ) {
				throw new Exception("Theme was not changed. Theme file is not writeable: " . $fileToUpdate);
			}
		}

		$fileToUpdate = get_theme_file_path() . '/theme.json';
		if ( file_exists( $fileToUpdate ) && ! wp_is_writable( $fileToUpdate ) ) {
			throw new Exception("Theme file is not writeable: " . $fileToUpdate);
		}
	}

	protected function update_template_and_parts_files() {

		$user_customisations = $this->get_user_customisations();

		foreach ( $user_customisations['templates'] as $template ) {
			$fileToUpdateFolder = get_theme_file_path() . '/templates/';
			$fileToUpdate = $fileToUpdateFolder .
				$template->slug . '.html';
			$filesystem_result = file_put_contents(
				$fileToUpdate,
				$template->content
			);
			if( $filesystem_result === false ) {
				throw new Exception("Something went wrong updating $fileToUpdate" .
				 "Some files may have been changed.");
			}
		}

		foreach ( $user_customisations['template_parts'] as $template_part ) {
			$fileToUpdateFolder = get_theme_file_path() . '/parts/';
			$fileToUpdate = $fileToUpdateFolder .
				$template_part->slug . '.html';
			$filesystem_result = file_put_contents(
				$fileToUpdate,
				$template_part->content
			);
			if( $filesystem_result === false ) {
				throw new Exception("Something went wrong updating $fileToUpdate" .
				 "Some files may have been changed.");
			}
		}
	}

	protected function update_theme_json_file() {
		$fileToUpdate = get_theme_file_path() . '/theme.json';
		$filesystem_result === file_put_contents(
			$fileToUpdate,
			gutenberg_export_theme_json()
		);
		if( $filesystem_result === false ) {
			throw new Exception("Something went wrong updating $fileToUpdate" .
				 "Some files may have been changed.");
		}
	}

	protected function get_theme_file_path() {
		if ( $this->theme_file_path !== '' ) {
			return $this->theme_file_path;
		}
		$this->theme_file_path = get_theme_file_path();
		return $this->theme_file_path;
	}

	protected function get_user_customisations() {

		if ( $this->user_customisations !== [] ) {
			return $this->user_customisations;
		}

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

		$this->user_customisations = array(
			'templates'=>$exported_templates,
			'template_parts'=>$exported_template_parts
		);

		return $this->user_customisations;

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
