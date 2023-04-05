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
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
		parent::register_routes();
	}

	/**
	 * Retrieves the global styles type' schema, conforming to JSON Schema.
	 *
	 * @since 5.9.0
	 * @since 6.3 Adds `revisions` schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => $this->post_type,
			'type'       => 'object',
			'properties' => array(
				'id'        => array(
					'description' => __( 'ID of global styles config.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'styles'    => array(
					'description' => __( 'Global styles.', 'gutenberg' ),
					'type'        => array( 'object' ),
					'context'     => array( 'view', 'edit' ),
				),
				'settings'  => array(
					'description' => __( 'Global settings.', 'gutenberg' ),
					'type'        => array( 'object' ),
					'context'     => array( 'view', 'edit' ),
				),
				'title'     => array(
					'description' => __( 'Title of the global styles variation.', 'gutenberg' ),
					'type'        => array( 'object', 'string' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'properties'  => array(
						'raw'      => array(
							'description' => __( 'Title for the global styles variation, as it exists in the database.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'rendered' => array(
							'description' => __( 'HTML title for the post, transformed for display.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
					),
				),
				'revisions' => array(
					'description' => __( 'Global styles revisions.', 'gutenberg' ),
					'type'        => array( 'object' ),
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
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
					'author'         => $post->post_author,
					'posts_per_page' => 100,
				)
			);

			if ( ! empty( $user_theme_revisions ) ) {
				// Mostly taken from wp_prepare_revisions_for_js().
				foreach ( $user_theme_revisions as $revision ) {
					$raw_revision_config = json_decode( $revision->post_content, true );
					$config              = ( new WP_Theme_JSON_Gutenberg( $raw_revision_config, 'custom' ) )->get_raw_data();
					$now_gmt             = time();
					$modified            = strtotime( $revision->post_modified );
					$modified_gmt        = strtotime( $revision->post_modified_gmt . ' +0000' );
					/* translators: %s: Human-readable time difference. */
					$time_ago    = sprintf( __( '%s ago', 'gutenberg' ), human_time_diff( $modified_gmt, $now_gmt ) );
					$date_short  = date_i18n( _x( 'j M @ H:i', 'revision date short format', 'gutenberg' ), $modified );
					$revisions[] = array(
						'styles'   => ! empty( $config['styles'] ) ? $config['styles'] : new stdClass(),
						'settings' => ! empty( $config['settings'] ) ? $config['settings'] : new stdClass(),
						'title'    => array(
							'raw'      => $revision->post_modified,
							/* translators: 1: Human-readable time difference, 2: short date combined to show rendered revision date. */
							'rendered' => sprintf( __( '%1$s (%2$s)', 'gutenberg' ), $time_ago, $date_short ),
						),
						'id'       => $revision->ID,
					);
				}
			}
		}
		return rest_ensure_response( $revisions );
	}

	/**
	 * Prepare a global styles config output for response.
	 *
	 * @since 5.9.0
	 * @since 6.2 Handling of style.css was added to WP_Theme_JSON.
	 * @since 6.3 Adds version-history to the response object.
	 *
	 * @param WP_Post         $post Global Styles post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$raw_config                       = json_decode( $post->post_content, true );
		$is_global_styles_user_theme_json = isset( $raw_config['isGlobalStylesUserThemeJSON'] ) && true === $raw_config['isGlobalStylesUserThemeJSON'];
		$config                           = array();
		if ( $is_global_styles_user_theme_json ) {
			$config = ( new WP_Theme_JSON_Gutenberg( $raw_config, 'custom' ) )->get_raw_data();
		}

		// Base fields for every post.
		$data   = array();
		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $post->ID;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}
		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $post->post_title;
		}
		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			add_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );

			$data['title']['rendered'] = get_the_title( $post->ID );

			remove_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );
		}

		if ( rest_is_field_included( 'settings', $fields ) ) {
			$data['settings'] = ! empty( $config['settings'] ) && $is_global_styles_user_theme_json ? $config['settings'] : new stdClass();
		}

		if ( rest_is_field_included( 'styles', $fields ) ) {
			$data['styles'] = ! empty( $config['styles'] ) && $is_global_styles_user_theme_json ? $config['styles'] : new stdClass();
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = $this->prepare_links( $post->ID );
			if ( $is_global_styles_user_theme_json ) {
				$revisions                = wp_get_latest_revision_id_and_total_count( $post->ID );
				$revisions_count          = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
				$revisions_base           = sprintf( '/%s/%s/%d/revisions', $this->namespace, $this->rest_base, $post->ID );
				$links['version-history'] = array(
					'href'  => rest_url( $revisions_base ),
					'count' => $revisions_count,
				);
			}
			$response->add_links( $links );
			if ( ! empty( $links['self']['href'] ) ) {
				$actions = $this->get_available_actions();
				$self    = $links['self']['href'];
				foreach ( $actions as $rel ) {
					$response->add_link( $rel, $self );
				}
			}
		}

		return $response;
	}
}
