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
class Gutenberg_REST_Edit_Site_Export_Controller_6_1 extends Gutenberg_REST_Edit_Site_Export_Controller {



	/**
	 * Registers the necessary REST API routes.
	 */
	public function register_routes() {
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

		parent::register_routes();
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
	 * Update the files of a block theme with the template customisations
	 * made in the site editor.
	 *
	 * @return WP_Error|void
	 */
	public function update_theme() {
		if ( is_child_theme() ) {
			$this->save_theme_locally( 'current' );
		}
		else {
			$this->save_theme_locally( 'all' );
		}
		$this->clear_user_customizations();
		return rest_ensure_response(  array( "update_theme" => true ) );
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
			WP_Theme_JSON_Resolver_6_1::export_theme_data( $export_type )
		);
	}
}
