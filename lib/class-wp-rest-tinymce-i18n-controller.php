<?php
/**
 * TinyMCE i18n controller.
 *
 * @package gutenberg
 */

/**
 * Endpoint for retrieving TinyMCE translations needed to initialize the library
 * on the frontend. Used by the classic block's edit LazyLoad wrapper.
 *
 * Class WP_REST_TinyMCE_I18n_Controller
 *
 * @see WP_REST_Controller
 */
class WP_REST_TinyMCE_I18n_Controller extends WP_REST_Controller {

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			'wp/v2',
			'/tinymce-i18n',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_translations' ],
					'permission_callback' => [ $this, 'check_permissions' ],
					'args'                => [],
				],
				'schema' => array( $this, 'get_item_schema' ),
			]
		);
	}

	/**
	 * Get the translations for the current user's locale.
	 *
	 * _WP_Editors is not included by default so we need to require it
	 * if the class isn't available. We should probably refactor all the
	 * TinyMCE translation files out of _WP_Editors. This shouldn't be
	 * too hard considering they're already all static functions.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return array
	 */
	public function get_translations( $request ) {
		if ( ! class_exists( '_WP_Editors', false ) ) {
			require ABSPATH . WPINC . '/class-wp-editor.php';
		}

		$mce_locale = _WP_Editors::get_mce_locale();
		$json_only = true;
		$baseurl = _WP_Editors::get_baseurl();

		return [
			"translations" => _WP_Editors::wp_mce_translation( $mce_locale, $json_only ),
			"locale" => $mce_locale,
			"locale_script_handle" => "$baseurl/langs/$mce_locale.js",
		];
	}

	/**
	 * This endpoint is only mean to be used from the editor so it can be safely
	 * restricted only to users that can edit posts.
	 *
	 * @param WP_REST_Request $request Request.
	 *
	 * @return bool|true|WP_Error
	 */
	public function check_permissions( $request ) {
		return current_user_can( 'edit_posts' );
	}
}
