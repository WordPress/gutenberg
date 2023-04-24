<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Global Styles REST API Controller.
 */
class Gutenberg_REST_Global_Styles_Controller_6_3 extends Gutenberg_REST_Global_Styles_Controller_6_2 {
	/**
	 * Registers the controllers routes.
	 *
	 * @since 6.3 Registers `/revisions` endpoint.
	 *
	 * @return void
	 */
	public function register_routes() {
		// Lists revisions for a single global style variation based on the given id.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\/\w-]+)/revisions',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_revisions' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description'       => __( 'The id of the global styles post.', 'gutenberg' ),
							'type'              => 'string',
							'sanitize_callback' => array( $this, '_sanitize_global_styles_callback' ),
						),
					),
				),
			)
		);
		parent::register_routes();
	}

	/**
	 * Returns revisions of the given global styles config custom post type.
	 *
	 * @since 6.3
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item_revisions( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}
		$revisions                        = array();
		$raw_config                       = json_decode( $post->post_content, true );
		$is_global_styles_user_theme_json = isset( $raw_config['isGlobalStylesUserThemeJSON'] ) && true === $raw_config['isGlobalStylesUserThemeJSON'];

		if ( $is_global_styles_user_theme_json ) {
			$user_theme_revisions = wp_get_post_revisions(
				$post->ID,
				array(
					'posts_per_page' => 100,
				)
			);

			if ( ! empty( $user_theme_revisions ) ) {
				// Mostly taken from wp_prepare_revisions_for_js().
				foreach ( $user_theme_revisions as $id => $revision ) {
					$raw_revision_config = json_decode( $revision->post_content, true );
					$config              = ( new WP_Theme_JSON_Gutenberg( $raw_revision_config, 'custom' ) )->get_raw_data();
					$now_gmt             = time();
					$modified            = strtotime( $revision->post_modified );
					$modified_gmt        = strtotime( $revision->post_modified_gmt . ' +0000' );
					/* translators: %s: Human-readable time difference. */
					$time_ago    = sprintf( __( '%s ago', 'gutenberg' ), human_time_diff( $modified_gmt, $now_gmt ) );
					$date_short  = date_i18n( _x( 'j M @ H:i', 'revision date short format', 'gutenberg' ), $modified );
					$revisions[] = array(
						'styles'    => ! empty( $config['styles'] ) ? $config['styles'] : new stdClass(),
						'settings'  => ! empty( $config['settings'] ) ? $config['settings'] : new stdClass(),
						'date'      => array(
							'raw'      => $revision->post_modified,
							/* translators: 1: Human-readable time difference, 2: short date combined to show rendered revision date. */
							'rendered' => sprintf( __( '%1$s (%2$s)', 'gutenberg' ), $time_ago, $date_short ),
						),
						'id'        => $id,
						'is_latest' => array_key_first( $user_theme_revisions ) === $id,
						'author'    => array(
							'display_name' => get_the_author_meta( 'display_name', $post->post_author ),
							'avatar_url'   => get_avatar_url(
								$post->post_author,
								array(
									'size' => 24,
								)
							),
						),
					);
				}
			}
		}
		return rest_ensure_response( $revisions );
	}

	/**
	 * Prepares links for the request.
	 *
	 * @since 5.9.0
	 * @since 6.3 Adds revisions to version-history.
	 *
	 * @param integer $id ID.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $id ) {
		$base = sprintf( '%s/%s', $this->namespace, $this->rest_base );

		$links = array(
			'self' => array(
				'href' => rest_url( trailingslashit( $base ) . $id ),
			),
		);

		if ( post_type_supports( $this->post_type, 'revisions' ) ) {
			$revisions                = wp_get_latest_revision_id_and_total_count( $id );
			$revisions_count          = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
			$revisions_base           = sprintf( '/%s/%s/%d/revisions', $this->namespace, $this->rest_base, $id );
			$links['version-history'] = array(
				'href'  => rest_url( $revisions_base ),
				'count' => $revisions_count,
			);
		}

		return $links;
	}
}
