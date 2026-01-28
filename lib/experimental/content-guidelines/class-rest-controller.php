<?php
/**
 * Content Guidelines REST API Controller.
 *
 * @package ContentGuidelines
 */

namespace Gutenberg\ContentGuidelines;

defined( 'ABSPATH' ) || exit;

/**
 * REST API controller for content guidelines.
 */
// phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.ClassNotGuardedAgainstRedeclaration -- Namespaced class won't conflict with Core.
class REST_Controller {

	/**
	 * Namespace for the REST API.
	 */
	const REST_NAMESPACE = 'wp/v2';

	/**
	 * Base route.
	 */
	const REST_BASE = 'content-guidelines';

	/**
	 * Initialize the REST routes.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_routes() {
		// Get/Update guidelines (active + draft + metadata).
		// PUT/POST is used by core-data's saveEditedEntityRecord for SaveHub integration.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_guidelines' ),
					'permission_callback' => array( __CLASS__, 'can_view' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'save_and_publish' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
					'args'                => array(
						'guidelines' => array(
							'type'              => 'object',
							'sanitize_callback' => array( Post_Type::class, 'sanitize_guidelines' ),
						),
					),
				),
			)
		);

		// Entity record endpoint - core-data fetches from baseURL/{id}.
		// This route supports the canonical pattern used by useEntityRecord.
		// Only matches 'current' to avoid conflicts with other routes like /draft, /publish.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/(?P<id>current)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_guidelines' ),
					'permission_callback' => array( __CLASS__, 'can_view' ),
					'args'                => array(
						'id' => array(
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => 'Entity record ID (always "current" for guidelines).',
						),
					),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'save_and_publish' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
					'args'                => array(
						'id'         => array(
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'guidelines' => array(
							'type'              => 'object',
							'sanitize_callback' => array( Post_Type::class, 'sanitize_guidelines' ),
						),
					),
				),
			)
		);

		// Update draft.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/draft',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_draft' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
					'args'                => array(
						'guidelines' => array(
							'required'          => true,
							'type'              => 'object',
							'sanitize_callback' => array( Post_Type::class, 'sanitize_guidelines' ),
						),
					),
				),
			)
		);

		// Publish draft.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/publish',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'publish_draft' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
				),
			)
		);

		// Discard draft.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/discard-draft',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'discard_draft' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
				),
			)
		);

		// Get revisions.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/revisions',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_revisions' ),
					'permission_callback' => array( __CLASS__, 'can_view' ),
				),
			)
		);

		// Restore revision.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/restore/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'restore_revision' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
					'args'                => array(
						'id' => array(
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);

		// Get context packet.
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/packet',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_packet' ),
					'permission_callback' => array( __CLASS__, 'can_view' ),
					'args'                => array(
						'task'       => array(
							'type'    => 'string',
							'default' => 'writing',
							'enum'    => array( 'writing', 'headline', 'cta', 'image', 'coach' ),
						),
						'post_id'    => array(
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						),
						'use'        => array(
							'type'    => 'string',
							'default' => 'active',
							'enum'    => array( 'active', 'draft' ),
						),
						'max_chars'  => array(
							'type'    => 'integer',
							'default' => 2000,
						),
						'block_name' => array(
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => 'Block name for block-specific guidelines (e.g., core/paragraph).',
						),
					),
				),
			)
		);

		// Run playground test (lint checks, optionally AI).
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/test',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'run_test' ),
					'permission_callback' => array( __CLASS__, 'can_edit' ),
					'args'                => array(
						'task'               => array(
							'type'    => 'string',
							'default' => 'rewrite_intro',
							'enum'    => array( 'rewrite_intro', 'generate_headlines', 'write_cta' ),
						),
						'fixture_post_id'    => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
						'use'                => array(
							'type'    => 'string',
							'default' => 'draft',
							'enum'    => array( 'active', 'draft' ),
						),
						'compare'            => array(
							'type'    => 'boolean',
							'default' => false,
						),
						'extra_instructions' => array(
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_textarea_field',
						),
					),
				),
			)
		);

		// Get guidelines for a specific post (with block analysis).
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/for-post/(?P<post_id>[\d]+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_post_guidelines' ),
					'permission_callback' => array( __CLASS__, 'can_view' ),
					'args'                => array(
						'post_id' => array(
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => 'The post ID to get guidelines for.',
						),
						'task'    => array(
							'type'    => 'string',
							'default' => 'writing',
							'enum'    => array( 'writing', 'headline', 'cta', 'image', 'coach' ),
						),
						'use'     => array(
							'type'    => 'string',
							'default' => 'active',
							'enum'    => array( 'active', 'draft' ),
						),
					),
				),
			)
		);

		// Get guidelines for multiple blocks (batch endpoint).
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/blocks',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_blocks_guidelines' ),
					'permission_callback' => array( __CLASS__, 'can_view' ),
					'args'                => array(
						'blocks' => array(
							'required'          => true,
							'type'              => 'array',
							'items'             => array( 'type' => 'string' ),
							'description'       => 'Array of block names to get guidelines for.',
							'sanitize_callback' => function ( $value ) {
								if ( is_string( $value ) ) {
									$value = explode( ',', $value );
								}
								return array_map( 'sanitize_text_field', (array) $value );
							},
						),
						'task'   => array(
							'type'    => 'string',
							'default' => 'writing',
							'enum'    => array( 'writing', 'headline', 'cta', 'image', 'coach' ),
						),
						'use'    => array(
							'type'    => 'string',
							'default' => 'active',
							'enum'    => array( 'active', 'draft' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Check if user can view guidelines.
	 *
	 * @return bool True if can view.
	 */
	public static function can_view() {
		return current_user_can( 'edit_theme_options' );
	}

	/**
	 * Check if user can edit guidelines.
	 *
	 * @return bool True if can edit.
	 */
	public static function can_edit() {
		return current_user_can( 'edit_theme_options' );
	}

	/**
	 * Get guidelines as a core-data entity record.
	 *
	 * Returns the guidelines in entity format for direct use with
	 * core-data's useEntityRecord hook.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function get_guidelines( $request ) {
		$post       = Post_Type::get_guidelines_post();
		$guidelines = Post_Type::get_active_guidelines();

		if ( ! $guidelines ) {
			$guidelines = Post_Type::get_default_guidelines();
		}

		$revision_count = 0;
		if ( $post ) {
			$history = Post_Type::get_history( $post->ID );
			if ( ! empty( $history ) ) {
				$revision_count = count( $history );
			} else {
				$revision_count = count( wp_get_post_revisions( $post->ID, array( 'check_enabled' => false ) ) );
			}
		}

		// Build entity record with guidelines sections as top-level properties
		$response = array(
			'id'             => 'current',
			// Guidelines sections (flattened)
			'brand_context'  => isset( $guidelines['brand_context'] ) ? $guidelines['brand_context'] : array(),
			'voice_tone'     => isset( $guidelines['voice_tone'] ) ? $guidelines['voice_tone'] : array(),
			'copy_rules'     => isset( $guidelines['copy_rules'] ) ? $guidelines['copy_rules'] : array(),
			'vocabulary'     => isset( $guidelines['vocabulary'] ) ? $guidelines['vocabulary'] : array(),
			'heuristics'     => isset( $guidelines['heuristics'] ) ? $guidelines['heuristics'] : array(),
			'references'     => isset( $guidelines['references'] ) ? $guidelines['references'] : array(),
			'images'         => isset( $guidelines['images'] ) ? $guidelines['images'] : array(),
			'notes'          => isset( $guidelines['notes'] ) ? $guidelines['notes'] : '',
			'blocks'         => isset( $guidelines['blocks'] ) ? $guidelines['blocks'] : array(),
			// Metadata
			'post_id'        => $post ? $post->ID : null,
			'updated_at'     => $post ? $post->post_modified_gmt : null,
			'revision_count' => $revision_count,
		);

		return rest_ensure_response( $response );
	}

	/**
	 * Update draft guidelines.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function update_draft( $request ) {
		$guidelines = $request->get_param( 'guidelines' );
		$result     = Post_Type::save_draft( $guidelines );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'message' => __( 'Draft saved.', 'gutenberg' ),
			)
		);
	}

	/**
	 * Save guidelines directly (canonical core-data pattern).
	 *
	 * This endpoint is called by core-data's saveEditedEntityRecord
	 * when the user clicks "Save" in the SaveHub. It receives the
	 * full entity record and saves it directly.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function save_and_publish( $request ) {
		$params = $request->get_json_params();

		// Extract guidelines sections from the entity record
		$guidelines = array(
			'brand_context' => isset( $params['brand_context'] ) ? $params['brand_context'] : array(),
			'voice_tone'    => isset( $params['voice_tone'] ) ? $params['voice_tone'] : array(),
			'copy_rules'    => isset( $params['copy_rules'] ) ? $params['copy_rules'] : array(),
			'vocabulary'    => isset( $params['vocabulary'] ) ? $params['vocabulary'] : array(),
			'heuristics'    => isset( $params['heuristics'] ) ? $params['heuristics'] : array(),
			'references'    => isset( $params['references'] ) ? $params['references'] : array(),
			'images'        => isset( $params['images'] ) ? $params['images'] : array(),
			'notes'         => isset( $params['notes'] ) ? $params['notes'] : '',
			'blocks'        => isset( $params['blocks'] ) ? $params['blocks'] : array(),
		);

		// Sanitize the guidelines
		$guidelines = Post_Type::sanitize_guidelines( $guidelines );

		// Save directly to post content (creates revision automatically)
		$result = Post_Type::save_guidelines( $guidelines );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Clear any legacy draft meta
		$post = Post_Type::get_guidelines_post();
		if ( $post ) {
			delete_post_meta( $post->ID, '_wp_content_guidelines_draft' );
		}

		// Return the saved entity record
		return self::get_guidelines( $request );
	}

	/**
	 * Publish draft guidelines.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function publish_draft( $request ) {
		$result = Post_Type::publish_draft();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'post_id' => $result,
				'message' => __( 'Guidelines published.', 'gutenberg' ),
			)
		);
	}

	/**
	 * Discard draft guidelines.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function discard_draft( $request ) {
		Post_Type::discard_draft();

		return rest_ensure_response(
			array(
				'success' => true,
				'message' => __( 'Draft discarded.', 'gutenberg' ),
			)
		);
	}

	/**
	 * Get revision history.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function get_revisions( $request ) {
		$post = Post_Type::get_guidelines_post();

		if ( ! $post ) {
			return rest_ensure_response( array() );
		}

		$history = Post_Type::get_history( $post->ID );
		if ( ! empty( $history ) ) {
			// Newest first.
			usort(
				$history,
				function ( $a, $b ) {
					return absint( $b['id'] ) <=> absint( $a['id'] );
				}
			);

			$items = array();

			foreach ( $history as $entry ) {
				$author = null;
				if ( ! empty( $entry['author_id'] ) ) {
					$author = get_userdata( absint( $entry['author_id'] ) );
				}

				$date_gmt_mysql = isset( $entry['date_gmt'] ) ? $entry['date_gmt'] : '';
				$date_gmt       = $date_gmt_mysql ? mysql_to_rfc3339( $date_gmt_mysql ) : '';
				$date_mysql     = $date_gmt_mysql ? get_date_from_gmt( $date_gmt_mysql ) : '';
				$date           = $date_mysql ? mysql_to_rfc3339( $date_mysql ) : '';

				$author_id = ! empty( $entry['author_id'] ) ? absint( $entry['author_id'] ) : 0;
				$items[]   = array(
					'id'           => absint( $entry['id'] ),
					'author'       => array(
						'id'     => $author_id,
						'name'   => $author ? $author->display_name : __( 'Unknown', 'gutenberg' ),
						'avatar' => get_avatar_url(
							$author_id,
							array(
								'size'    => 48,
								'default' => 'mystery',
							)
						),
					),
					'date'         => $date,
					'date_gmt'     => $date_gmt,
					'modified'     => $date,
					'modified_gmt' => $date_gmt,
				);
			}

			return rest_ensure_response( $items );
		}

		$revisions = wp_get_post_revisions(
			$post->ID,
			array(
				'order'         => 'DESC',
				'orderby'       => 'date',
				'check_enabled' => false, // Bypass WP_POST_REVISIONS check - we support revisions via post_type_supports.
			)
		);

		$items  = array();
		$author = get_userdata( $post->post_author );

		// Always include the current version first.
		$items[] = array(
			'id'           => $post->ID,
			'author'       => array(
				'id'     => absint( $post->post_author ),
				'name'   => $author ? $author->display_name : __( 'Unknown', 'gutenberg' ),
				'avatar' => get_avatar_url(
					$post->post_author,
					array(
						'size'    => 48,
						'default' => 'mystery',
					)
				),
			),
			'date'         => mysql_to_rfc3339( $post->post_modified ),
			'date_gmt'     => mysql_to_rfc3339( $post->post_modified_gmt ),
			'modified'     => mysql_to_rfc3339( $post->post_modified ),
			'modified_gmt' => mysql_to_rfc3339( $post->post_modified_gmt ),
		);

		foreach ( $revisions as $revision ) {
			$author = get_userdata( $revision->post_author );

			$items[] = array(
				'id'           => $revision->ID,
				'author'       => array(
					'id'     => $revision->post_author,
					'name'   => $author ? $author->display_name : __( 'Unknown', 'gutenberg' ),
					'avatar' => get_avatar_url(
						$revision->post_author,
						array(
							'size'    => 48,
							'default' => 'mystery',
						)
					),
				),
				'date'         => mysql_to_rfc3339( $revision->post_date ),
				'date_gmt'     => mysql_to_rfc3339( $revision->post_date_gmt ),
				'modified'     => mysql_to_rfc3339( $revision->post_modified ),
				'modified_gmt' => mysql_to_rfc3339( $revision->post_modified_gmt ),
			);
		}

		return rest_ensure_response( $items );
	}

	/**
	 * Restore a revision.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function restore_revision( $request ) {
		$revision_id = $request->get_param( 'id' );
		$result      = Post_Type::restore_revision( $revision_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'post_id' => $result,
				'message' => __( 'Revision restored.', 'gutenberg' ),
			)
		);
	}

	/**
	 * Get context packet for AI consumption.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response Response.
	 */
	public static function get_packet( $request ) {
		$packet = Context_Packet_Builder::get_packet(
			array(
				'task'       => $request->get_param( 'task' ),
				'post_id'    => $request->get_param( 'post_id' ),
				'use'        => $request->get_param( 'use' ),
				'max_chars'  => $request->get_param( 'max_chars' ),
				'block_name' => $request->get_param( 'block_name' ),
			)
		);

		return rest_ensure_response( $packet );
	}

	/**
	 * Run playground test.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function run_test( $request ) {
		$task               = $request->get_param( 'task' );
		$fixture_post_id    = $request->get_param( 'fixture_post_id' );
		$use                = $request->get_param( 'use' );
		$compare            = $request->get_param( 'compare' );
		$extra_instructions = $request->get_param( 'extra_instructions' );

		$fixture_post = get_post( $fixture_post_id );

		if ( ! $fixture_post ) {
			return new \WP_Error(
				'invalid_fixture',
				__( 'Invalid fixture post.', 'gutenberg' )
			);
		}

		// Get guidelines.
		$guidelines = 'draft' === $use
			? Post_Type::get_draft_guidelines()
			: Post_Type::get_active_guidelines();

		if ( ! $guidelines ) {
			$guidelines = Post_Type::get_default_guidelines();
		}

		// Extract fixture content.
		$fixture_content = self::extract_fixture_content( $fixture_post, $task );

		// Run local lint checks (always available).
		$lint_results = Lint_Checker::check( $fixture_content, $guidelines );

		// Build context packet.
		$context_packet = Context_Packet_Builder::get_packet(
			array(
				'task'    => self::map_playground_task( $task ),
				'post_id' => $fixture_post_id,
				'use'     => $use,
			)
		);

		// Prepare the result.
		$result = array(
			'lint_results'   => $lint_results,
			'context_packet' => $context_packet,
			'fixture'        => array(
				'title'   => $fixture_post->post_title,
				'excerpt' => wp_trim_words( $fixture_content, 100 ),
			),
		);

		// Try to run AI-powered test if a provider is available.
		$ai_request = array(
			'task'               => $task,
			'fixture_content'    => $fixture_content,
			'guidelines'         => $guidelines,
			'context_packet'     => $context_packet,
			'extra_instructions' => $extra_instructions,
		);

		/**
		 * Filter to run AI-powered playground tests.
		 *
		 * Providers should hook into this to supply AI-generated results.
		 *
		 * @param array|null $ai_result The AI result (null if no provider).
		 * @param array      $ai_request The request data.
		 */
		$ai_result = apply_filters( 'wp_content_guidelines_run_playground_test', null, $ai_request );

		if ( null !== $ai_result ) {
			$result['ai_result'] = $ai_result;
		} else {
			$result['ai_available'] = false;
			$result['ai_message']   = __( 'No AI provider connected. Showing lint checks and context preview only.', 'gutenberg' );
		}

		// If compare mode, also get active guidelines results.
		if ( $compare && 'draft' === $use ) {
			$active_guidelines = Post_Type::get_active_guidelines();

			if ( $active_guidelines ) {
				$active_lint   = Lint_Checker::check( $fixture_content, $active_guidelines );
				$active_packet = Context_Packet_Builder::get_packet(
					array(
						'task'    => self::map_playground_task( $task ),
						'post_id' => $fixture_post_id,
						'use'     => 'active',
					)
				);

				$result['compare'] = array(
					'lint_results'   => $active_lint,
					'context_packet' => $active_packet,
				);

				// Also run AI compare if available.
				$active_ai_request = array(
					'task'               => $task,
					'fixture_content'    => $fixture_content,
					'guidelines'         => $active_guidelines,
					'context_packet'     => $active_packet,
					'extra_instructions' => $extra_instructions,
				);

				$active_ai_result = apply_filters( 'wp_content_guidelines_run_playground_test', null, $active_ai_request );

				if ( null !== $active_ai_result ) {
					$result['compare']['ai_result'] = $active_ai_result;
				}
			}
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Extract content from fixture post for a specific task.
	 *
	 * @param \WP_Post $post The post object.
	 * @param string   $task The task type.
	 * @return string The extracted content.
	 */
	private static function extract_fixture_content( $post, $task ) {
		$content = $post->post_content;

		// Strip blocks and get plain text.
		$content = wp_strip_all_tags( do_blocks( $content ) );

		switch ( $task ) {
			case 'rewrite_intro':
				// Get first ~500 characters.
				return mb_substr( $content, 0, 500 );

			case 'generate_headlines':
				// Get title + excerpt for context.
				return $post->post_title . "\n\n" . wp_trim_words( $content, 150 );

			case 'write_cta':
				// Get full content (limited).
				return wp_trim_words( $content, 300 );

			default:
				return wp_trim_words( $content, 200 );
		}
	}

	/**
	 * Map playground task to context packet task type.
	 *
	 * @param string $playground_task The playground task.
	 * @return string The context packet task.
	 */
	private static function map_playground_task( $playground_task ) {
		$map = array(
			'rewrite_intro'      => 'writing',
			'generate_headlines' => 'headline',
			'write_cta'          => 'cta',
		);

		return isset( $map[ $playground_task ] ) ? $map[ $playground_task ] : 'writing';
	}

	/**
	 * Get guidelines for a specific post with block analysis.
	 *
	 * Analyzes the blocks in a post and returns a context packet with
	 * both site-level and block-specific guidelines merged.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function get_post_guidelines( $request ) {
		$post_id = $request->get_param( 'post_id' );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return new \WP_Error(
				'invalid_post',
				__( 'Post not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$result = \ContentGuidelines\get_content_guidelines_for_post(
			$post,
			array(
				'task' => $request->get_param( 'task' ),
				'use'  => $request->get_param( 'use' ),
			)
		);

		return rest_ensure_response( $result );
	}

	/**
	 * Get guidelines for multiple blocks (batch endpoint).
	 *
	 * Returns site-level and block-specific guidelines for the requested
	 * block types. Useful for agents working with specific blocks.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response Response.
	 */
	public static function get_blocks_guidelines( $request ) {
		$block_names = $request->get_param( 'blocks' );

		$result = \ContentGuidelines\get_block_guidelines(
			$block_names,
			array(
				'task' => $request->get_param( 'task' ),
				'use'  => $request->get_param( 'use' ),
			)
		);

		return rest_ensure_response( $result );
	}
}
