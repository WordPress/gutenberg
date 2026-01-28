<?php
/**
 * Content Guidelines Post Type registration.
 *
 * @package ContentGuidelines
 */

namespace Gutenberg\ContentGuidelines;

defined( 'ABSPATH' ) || exit;

/**
 * Handles the content_guidelines custom post type.
 */
// phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.ClassNotGuardedAgainstRedeclaration -- Namespaced class won't conflict with Core.
class Post_Type {

	/**
	 * Post type name.
	 */
	const POST_TYPE = 'content_guidelines';

	/**
	 * Option key for storing the canonical guidelines post ID.
	 *
	 * Prevents multiple CPT posts from being created/used over time.
	 */
	const POST_ID_OPTION = 'wp_content_guidelines_post_id';

	/**
	 * Option key for tracking history migration.
	 *
	 * Used to avoid rebuilding history on every request.
	 */
	const HISTORY_MIGRATED_OPTION = 'wp_content_guidelines_history_migrated_post_id';

	/**
	 * Meta key for draft guidelines.
	 */
	const DRAFT_META_KEY = '_wp_content_guidelines_draft';

	/**
	 * Meta key for generation sources.
	 */
	const SOURCES_META_KEY = '_wp_content_guidelines_sources';

	/**
	 * Meta key for revision history.
	 */
	const HISTORY_META_KEY = '_wp_content_guidelines_history';

	/**
	 * Encode data to JSON with Unicode characters preserved.
	 *
	 * @param mixed $data Data to encode.
	 * @return string|false JSON string or false on failure.
	 */
	private static function json_encode_unicode( $data ) {
		return wp_json_encode( $data, JSON_UNESCAPED_UNICODE );
	}

	/**
	 * Initialize the post type.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_action( 'init', array( __CLASS__, 'register_post_meta' ) );

		// Ensure revisions are always enabled for our post type, regardless of WP_POST_REVISIONS.
		add_filter( 'wp_' . self::POST_TYPE . '_revisions_to_keep', array( __CLASS__, 'enable_revisions' ) );
	}

	/**
	 * Force revisions to be enabled for this post type.
	 *
	 * This ensures revisions work even if WP_POST_REVISIONS is disabled globally.
	 *
	 * @param int $num Number of revisions to keep.
	 * @return int Number of revisions to keep (-1 for unlimited).
	 */
	public static function enable_revisions( $num ) {
		// If revisions are disabled (0), enable unlimited revisions for our post type.
		// Otherwise respect the site's setting.
		return 0 === $num ? -1 : $num;
	}

	/**
	 * Register the custom post type.
	 */
	public static function register_post_type() {
		$labels = array(
			'name'          => _x( 'Content Guidelines', 'post type general name', 'gutenberg' ),
			'singular_name' => _x( 'Content Guidelines', 'post type singular name', 'gutenberg' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => false,
			'show_in_menu'       => false,
			'query_var'          => false,
			'capability_type'    => 'post',
			'capabilities'       => array(
				'read'                   => 'edit_theme_options',
				'create_posts'           => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'delete_posts'           => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
				'edit_others_posts'      => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
				'publish_posts'          => 'edit_theme_options',
			),
			'map_meta_cap'       => true,
			'hierarchical'       => false,
			'supports'           => array( 'revisions', 'custom-fields' ),
			'has_archive'        => false,
			'rewrite'            => false,
			'show_in_rest'       => false,
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Register post meta fields.
	 */
	public static function register_post_meta() {
		register_post_meta(
			self::POST_TYPE,
			self::DRAFT_META_KEY,
			array(
				'type'              => 'object',
				'single'            => true,
				'show_in_rest'      => array(
					'schema' => self::get_guidelines_schema(),
				),
				'auth_callback'     => function () {
					return current_user_can( 'edit_theme_options' );
				},
				'sanitize_callback' => array( __CLASS__, 'sanitize_guidelines' ),
			)
		);

		register_post_meta(
			self::POST_TYPE,
			self::SOURCES_META_KEY,
			array(
				'type'              => 'array',
				'single'            => true,
				'show_in_rest'      => array(
					'schema' => array(
						'type'  => 'array',
						'items' => array(
							'type' => 'integer',
						),
					),
				),
				'auth_callback'     => function () {
					return current_user_can( 'edit_theme_options' );
				},
				'sanitize_callback' => function ( $value ) {
					if ( ! is_array( $value ) ) {
						return array();
					}

					$sanitized = array_map( 'absint', $value );
					$sanitized = array_filter(
						$sanitized,
						function ( $source_id ) {
							return $source_id > 0;
						}
					);

					return array_values( $sanitized );
				},
			)
		);
	}

	/**
	 * Get the JSON schema for guidelines.
	 *
	 * @return array The schema definition.
	 */
	public static function get_guidelines_schema() {
		return array(
			'type'                 => 'object',
			'additionalProperties' => true,
			'properties'           => array(
				'version'       => array(
					'type'    => 'integer',
					'default' => 1,
				),
				'brand_context' => array(
					'type'       => 'object',
					'properties' => array(
						'site_description' => array( 'type' => 'string' ),
						'audience'         => array( 'type' => 'string' ),
						'primary_goal'     => array(
							'type' => 'string',
							'enum' => array( 'subscribe', 'sell', 'inform', 'community', 'other', '' ),
						),
						'topics'           => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
				),
				'voice_tone'    => array(
					'type'       => 'object',
					'properties' => array(
						'description' => array( 'type' => 'string' ),
						'tone_traits' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'tone_notes'  => array( 'type' => 'string' ),
						'pov'         => array(
							'type' => 'string',
							'enum' => array( 'we_you', 'i_you', 'third_person', '' ),
						),
						'readability' => array(
							'type' => 'string',
							'enum' => array( 'simple', 'general', 'expert', '' ),
						),
					),
				),
				'copy_rules'    => array(
					'type'       => 'object',
					'properties' => array(
						'dos'        => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'donts'      => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'formatting' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
				),
				'vocabulary'    => array(
					'type'       => 'object',
					'properties' => array(
						// Rich object arrays with term and note.
						'prefer'            => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'term' => array( 'type' => 'string' ),
									'note' => array( 'type' => 'string' ),
								),
							),
						),
						'avoid'             => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'term' => array( 'type' => 'string' ),
									'note' => array( 'type' => 'string' ),
								),
							),
						),
						// Additional vocabulary fields.
						'acronyms'          => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'acronym_usage'     => array(
							'type' => 'string',
							'enum' => array( 'expand_first', 'always_expand', 'acronym_only', '' ),
						),
						'custom_dictionary' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'voice_corrections' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
				),
				'heuristics'    => array(
					'type'       => 'object',
					'properties' => array(
						'words_per_sentence'      => array( 'type' => 'integer' ),
						'sentences_per_paragraph' => array( 'type' => 'number' ),
						'paragraphs_per_section'  => array( 'type' => 'integer' ),
						'reading_level'           => array(
							'type' => 'string',
							'enum' => array( 'simple', 'standard', 'advanced', 'custom', '' ),
						),
						'reading_level_custom'    => array( 'type' => 'string' ),
						'max_syllables'           => array( 'type' => 'integer' ),
					),
				),
				'references'    => array(
					'type'       => 'object',
					'properties' => array(
						'references' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'type'  => array(
										'type' => 'string',
										'enum' => array( 'website', 'article', 'book', 'document', 'competitor', 'other' ),
									),
									'title' => array( 'type' => 'string' ),
									'url'   => array( 'type' => 'string' ),
									'notes' => array( 'type' => 'string' ),
								),
							),
						),
						'notes'      => array( 'type' => 'string' ),
					),
				),
				'images'        => array(
					'type'       => 'object',
					'properties' => array(
						'style'               => array( 'type' => 'string' ),
						'alt_text_guidelines' => array( 'type' => 'string' ),
						'reference_images'    => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'id'    => array( 'type' => 'integer' ),
									'url'   => array( 'type' => 'string' ),
									'alt'   => array( 'type' => 'string' ),
									'notes' => array( 'type' => 'string' ),
								),
							),
						),
						// Keep image_style fields for API compatibility.
						'dos'                 => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'donts'               => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'text_policy'         => array(
							'type' => 'string',
							'enum' => array( 'never', 'only_if_requested', 'ok', '' ),
						),
					),
				),
				// Keep image_style for backward compatibility.
				'image_style'   => array(
					'type'       => 'object',
					'properties' => array(
						'dos'         => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'donts'       => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'text_policy' => array(
							'type' => 'string',
							'enum' => array( 'never', 'only_if_requested', 'ok', '' ),
						),
					),
				),
				'notes'         => array(
					'type' => 'string',
				),
				'blocks'        => array(
					'type'                 => 'object',
					'additionalProperties' => array(
						'type'       => 'object',
						'properties' => array(
							'copy_rules' => array(
								'type'       => 'object',
								'properties' => array(
									'dos'   => array(
										'type'  => 'array',
										'items' => array( 'type' => 'string' ),
									),
									'donts' => array(
										'type'  => 'array',
										'items' => array( 'type' => 'string' ),
									),
								),
							),
							'notes'      => array( 'type' => 'string' ),
						),
					),
				),
			),
		);
	}

	/**
	 * Sanitize guidelines data.
	 *
	 * @param mixed $value The value to sanitize.
	 * @return array Sanitized guidelines.
	 */
	public static function sanitize_guidelines( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		// Deep sanitize string values.
		return self::deep_sanitize( $value );
	}

	/**
	 * Recursively sanitize an array.
	 *
	 * @param array  $data           The data to sanitize.
	 * @param string $context        Optional context for key sanitization.
	 * @return array Sanitized data.
	 */
	private static function deep_sanitize( $data, $context = '' ) {
		$sanitized = array();

		foreach ( $data as $key => $value ) {
			// Skip internal/transient keys (e.g., client dirty markers).
			if ( is_string( $key ) && 0 === strpos( $key, '__' ) ) {
				continue;
			}

			// For numeric keys (array indices), preserve as-is.
			// For block names (e.g., 'core/list'), allow slashes.
			// For other keys, use sanitize_key.
			if ( is_int( $key ) ) {
				$sanitized_key = $key;
			} elseif ( 'blocks' === $context || preg_match( '#^[a-z0-9-]+/[a-z0-9-]+$#i', $key ) ) {
				// Block names - allow slashes, just sanitize parts.
				$sanitized_key = preg_replace( '/[^a-z0-9\/_-]/i', '', $key );
			} else {
				$sanitized_key = sanitize_key( $key );
			}

			if ( is_array( $value ) ) {
				// Pass context for 'blocks' key to allow block names with slashes.
				$child_context               = ( 'blocks' === $key ) ? 'blocks' : $context;
				$sanitized[ $sanitized_key ] = self::deep_sanitize( $value, $child_context );
			} elseif ( is_string( $value ) ) {
				$sanitized[ $sanitized_key ] = sanitize_textarea_field( $value );
			} elseif ( is_null( $value ) ) {
				$sanitized[ $sanitized_key ] = null;
			} elseif ( is_int( $value ) ) {
				$sanitized[ $sanitized_key ] = intval( $value );
			} elseif ( is_float( $value ) ) {
				$sanitized[ $sanitized_key ] = floatval( $value );
			} elseif ( is_bool( $value ) ) {
				$sanitized[ $sanitized_key ] = (bool) $value;
			}
		}

		return $sanitized;
	}

	/**
	 * Get or create the guidelines post for the current site.
	 *
	 * @return \WP_Post|null The guidelines post or null on failure.
	 */
	public static function get_guidelines_post() {
		$stored_post_id = absint( get_option( self::POST_ID_OPTION, 0 ) );
		if ( $stored_post_id ) {
			$stored_post = get_post( $stored_post_id );
			if ( $stored_post && self::POST_TYPE === $stored_post->post_type ) {
				return $stored_post;
			}
		}

		$posts = get_posts(
			array(
				'post_type'      => self::POST_TYPE,
				'posts_per_page' => 1,
				'post_status'    => 'any',
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);

		if ( ! empty( $posts ) ) {
			update_option( self::POST_ID_OPTION, absint( $posts[0]->ID ), false );
			return $posts[0];
		}

		return null;
	}

	/**
	 * Ensure history is consolidated onto the canonical guidelines post.
	 *
	 * Older versions of the plugin could create multiple guidelines posts; this
	 * migrates/merges revision history across posts into the canonical post so
	 * the History UI consistently shows past publishes.
	 *
	 * @param int   $canonical_post_id Canonical guidelines post ID.
	 * @param array $all_post_ids      Optional array of all guidelines post IDs.
	 * @return void
	 */
	private static function maybe_migrate_history_to_canonical_post( $canonical_post_id, $all_post_ids = array() ) {
		$canonical_post_id = absint( $canonical_post_id );
		if ( ! $canonical_post_id ) {
			return;
		}

		$migrated_for = absint( get_option( self::HISTORY_MIGRATED_OPTION, 0 ) );
		if ( $migrated_for === $canonical_post_id ) {
			return;
		}

		if ( empty( $all_post_ids ) ) {
			$all_post_ids = get_posts(
				array(
					'post_type'      => self::POST_TYPE,
					'posts_per_page' => -1,
					'post_status'    => 'any',
					'fields'         => 'ids',
					'no_found_rows'  => true,
				)
			);
			$all_post_ids = array_map( 'absint', (array) $all_post_ids );
		}

		$all_post_ids = array_values( array_unique( array_filter( $all_post_ids ) ) );
		if ( empty( $all_post_ids ) ) {
			update_option( self::HISTORY_MIGRATED_OPTION, $canonical_post_id, false );
			return;
		}

		$existing_canonical = self::get_history( $canonical_post_id );
		$has_other_history  = false;

		foreach ( $all_post_ids as $post_id ) {
			if ( $post_id === $canonical_post_id ) {
				continue;
			}
			$history = self::get_history( $post_id );
			if ( ! empty( $history ) ) {
				$has_other_history = true;
				break;
			}
		}

		// Only migrate if it would add value.
		if ( ! empty( $existing_canonical ) && ! $has_other_history ) {
			update_option( self::HISTORY_MIGRATED_OPTION, $canonical_post_id, false );
			return;
		}

		$entries = array();
		$seen    = array();

		foreach ( $all_post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post || self::POST_TYPE !== $post->post_type ) {
				continue;
			}

			// 1) Prefer existing meta-backed history.
			$history = self::get_history( $post_id );
			if ( ! empty( $history ) ) {
				foreach ( $history as $entry ) {
					if ( empty( $entry['date_gmt'] ) || empty( $entry['guidelines'] ) ) {
						continue;
					}

					$date_gmt   = sanitize_text_field( $entry['date_gmt'] );
					$guidelines = is_array( $entry['guidelines'] ) ? $entry['guidelines'] : array();
					if ( empty( $date_gmt ) || empty( $guidelines ) ) {
						continue;
					}

					$hash = md5( wp_json_encode( $guidelines ) . '|' . $date_gmt );
					if ( isset( $seen[ $hash ] ) ) {
						continue;
					}
					$seen[ $hash ] = true;

					$entries[] = array(
						'author_id'  => isset( $entry['author_id'] ) ? absint( $entry['author_id'] ) : absint( $post->post_author ),
						'date_gmt'   => $date_gmt,
						'guidelines' => self::sanitize_guidelines( $guidelines ),
					);
				}

				continue;
			}

			// 2) Fall back to WP revisions if available.
			$revisions = wp_get_post_revisions(
				$post_id,
				array(
					'order'         => 'ASC',
					'orderby'       => 'date',
					'check_enabled' => false,
				)
			);

			if ( ! empty( $revisions ) ) {
				foreach ( $revisions as $revision ) {
					$decoded = json_decode( $revision->post_content, true );
					if ( ! is_array( $decoded ) ) {
						continue;
					}

					$date_gmt = $revision->post_modified_gmt ? $revision->post_modified_gmt : $revision->post_date_gmt;
					$date_gmt = $date_gmt ? sanitize_text_field( $date_gmt ) : '';
					if ( empty( $date_gmt ) ) {
						continue;
					}

					$hash = md5( wp_json_encode( $decoded ) . '|' . $date_gmt );
					if ( isset( $seen[ $hash ] ) ) {
						continue;
					}
					$seen[ $hash ] = true;

					$entries[] = array(
						'author_id'  => absint( $revision->post_author ),
						'date_gmt'   => $date_gmt,
						'guidelines' => self::sanitize_guidelines( $decoded ),
					);
				}
			}

			// 3) Finally, include the current post content snapshot.
			$current = json_decode( $post->post_content, true );
			if ( is_array( $current ) ) {
				$date_gmt = $post->post_modified_gmt ? $post->post_modified_gmt : $post->post_date_gmt;
				$date_gmt = $date_gmt ? sanitize_text_field( $date_gmt ) : '';
				if ( ! empty( $date_gmt ) ) {
					$hash = md5( wp_json_encode( $current ) . '|' . $date_gmt );
					if ( ! isset( $seen[ $hash ] ) ) {
						$seen[ $hash ] = true;
						$entries[]     = array(
							'author_id'  => absint( $post->post_author ),
							'date_gmt'   => $date_gmt,
							'guidelines' => self::sanitize_guidelines( $current ),
						);
					}
				}
			}
		}

		if ( empty( $entries ) ) {
			update_option( self::HISTORY_MIGRATED_OPTION, $canonical_post_id, false );
			return;
		}

		usort(
			$entries,
			function ( $a, $b ) {
				return strcmp( $a['date_gmt'], $b['date_gmt'] );
			}
		);

		$migrated = array();
		$next_id  = 1;
		foreach ( $entries as $entry ) {
			$migrated[] = array(
				'id'         => $next_id++,
				'author_id'  => absint( $entry['author_id'] ),
				'date_gmt'   => $entry['date_gmt'],
				'guidelines' => $entry['guidelines'],
			);
		}

		update_post_meta( $canonical_post_id, self::HISTORY_META_KEY, $migrated );
		update_option( self::HISTORY_MIGRATED_OPTION, $canonical_post_id, false );
	}

	/**
	 * Create a new guidelines post.
	 *
	 * @param array $data Optional initial guidelines data.
	 * @return int|\WP_Error The post ID or error.
	 */
	public static function create_guidelines_post( $data = array() ) {
		$post_id = wp_insert_post(
			array(
				'post_type'    => self::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => __( 'Content Guidelines', 'gutenberg' ),
				'post_content' => self::json_encode_unicode( self::get_default_guidelines( $data ) ),
			),
			true
		);

		if ( ! is_wp_error( $post_id ) ) {
			update_option( self::POST_ID_OPTION, absint( $post_id ), false );
		}

		return $post_id;
	}

	/**
	 * Get default guidelines structure.
	 *
	 * @param array $overrides Optional values to merge.
	 * @return array Default guidelines.
	 */
	public static function get_default_guidelines( $overrides = array() ) {
		$defaults = array(
			'version'       => 1,
			'brand_context' => array(
				'site_description' => '',
				'audience'         => '',
				'primary_goal'     => '',
				'topics'           => array(),
			),
			'voice_tone'    => array(
				'description' => '',
				'tone_traits' => array(),
				'tone_notes'  => '',
				'pov'         => '',
				'readability' => 'general',
			),
			'copy_rules'    => array(
				'dos'        => array(),
				'donts'      => array(),
				'formatting' => array(),
			),
			'vocabulary'    => array(
				'prefer'            => array(), // Array of {term, note} objects.
				'avoid'             => array(), // Array of {term, note} objects.
				'acronyms'          => array(),
				'acronym_usage'     => 'expand_first',
				'custom_dictionary' => array(),
				'voice_corrections' => array(),
			),
			'heuristics'    => array(
				'words_per_sentence'      => null,
				'sentences_per_paragraph' => null,
				'paragraphs_per_section'  => null,
				'reading_level'           => '',
				'reading_level_custom'    => '',
				'max_syllables'           => null,
			),
			'references'    => array(
				'references' => array(),
				'notes'      => '',
			),
			'images'        => array(
				'style'               => '',
				'alt_text_guidelines' => '',
				'reference_images'    => array(),
				'dos'                 => array(),
				'donts'               => array(),
				'text_policy'         => '',
			),
			'notes'         => '',
			'blocks'        => array(),
		);

		return array_replace_recursive( $defaults, $overrides );
	}

	/**
	 * Get active guidelines data.
	 *
	 * @return array|null Guidelines data or null.
	 */
	public static function get_active_guidelines() {
		$post = self::get_guidelines_post();

		if ( ! $post ) {
			return null;
		}

		$content = json_decode( $post->post_content, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $content ) ) {
			return self::get_default_guidelines();
		}

		return $content;
	}

	/**
	 * Get draft guidelines data.
	 *
	 * @return array|null Draft guidelines or null.
	 */
	public static function get_draft_guidelines() {
		$post = self::get_guidelines_post();

		if ( ! $post ) {
			return null;
		}

		$draft = get_post_meta( $post->ID, self::DRAFT_META_KEY, true );

		if ( empty( $draft ) || ! is_array( $draft ) ) {
			return null;
		}

		return $draft;
	}

	/**
	 * Get revision history for a post.
	 *
	 * @param int $post_id The post ID.
	 * @return array History entries.
	 */
	public static function get_history( $post_id ) {
		$history = get_post_meta( $post_id, self::HISTORY_META_KEY, true );

		if ( empty( $history ) || ! is_array( $history ) ) {
			return array();
		}

		return $history;
	}

	/**
	 * Save draft guidelines.
	 *
	 * @param array $data The draft data.
	 * @return bool|int|\WP_Error True/post ID on success, WP_Error on failure.
	 */
	public static function save_draft( $data ) {
		$post = self::get_guidelines_post();

		// Create post if it doesn't exist.
		if ( ! $post ) {
			$post_id = self::create_guidelines_post();
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
			$post = get_post( $post_id );
		}

		$sanitized = self::sanitize_guidelines( $data );

		return update_post_meta( $post->ID, self::DRAFT_META_KEY, $sanitized );
	}

	/**
	 * Publish draft guidelines (promote to active).
	 *
	 * @return int|\WP_Error Post ID on success, WP_Error on failure.
	 */
	public static function publish_draft() {
		$post = self::get_guidelines_post();

		if ( ! $post ) {
			return new \WP_Error(
				'no_guidelines',
				__( 'No guidelines exist to publish.', 'gutenberg' )
			);
		}

		$draft = self::get_draft_guidelines();

		if ( ! $draft ) {
			return new \WP_Error(
				'no_draft',
				__( 'No draft changes to publish.', 'gutenberg' )
			);
		}

		// Add to custom history before updating.
		self::add_history_entry( $post->ID, $draft );

		// Update post content with draft (creates a revision).
		$result = wp_update_post(
			array(
				'ID'           => $post->ID,
				'post_content' => self::json_encode_unicode( $draft ),
			),
			true
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Clear the draft.
		delete_post_meta( $post->ID, self::DRAFT_META_KEY );

		return $result;
	}

	/**
	 * Save guidelines directly (canonical core-data pattern).
	 *
	 * This method saves guidelines immediately without requiring a draft.
	 * It's the standard save flow used by core-data's saveEntityRecord.
	 *
	 * @param array $guidelines The guidelines data to save.
	 * @return int|\WP_Error The post ID or error.
	 */
	public static function save_guidelines( $guidelines ) {
		$post = self::get_guidelines_post();

		// Create the post if it doesn't exist
		if ( ! $post ) {
			$post_id = self::create_guidelines_post( $guidelines );
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
			return $post_id;
		}

		// Add to custom history before updating
		self::add_history_entry( $post->ID, $guidelines );

		// Update post content (creates a WordPress revision automatically)
		$result = wp_update_post(
			array(
				'ID'           => $post->ID,
				'post_content' => self::json_encode_unicode( $guidelines ),
			),
			true
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return $result;
	}

	/**
	 * Add an entry to the custom history.
	 *
	 * @param int   $post_id    Post ID.
	 * @param array $guidelines Guidelines data being published.
	 * @return void
	 */
	private static function add_history_entry( $post_id, $guidelines ) {
		$history = self::get_history( $post_id );

		// Find the next ID.
		$max_id = 0;
		foreach ( $history as $entry ) {
			if ( isset( $entry['id'] ) && $entry['id'] > $max_id ) {
				$max_id = $entry['id'];
			}
		}

		// Add new entry.
		$history[] = array(
			'id'         => $max_id + 1,
			'author_id'  => get_current_user_id(),
			'date_gmt'   => current_time( 'mysql', true ),
			'guidelines' => self::sanitize_guidelines( $guidelines ),
		);

		// Keep only the last 50 entries to avoid bloat.
		if ( count( $history ) > 50 ) {
			$history = array_slice( $history, -50 );
		}

		update_post_meta( $post_id, self::HISTORY_META_KEY, $history );
	}

	/**
	 * Discard draft guidelines.
	 *
	 * @return bool True on success.
	 */
	public static function discard_draft() {
		$post = self::get_guidelines_post();

		if ( ! $post ) {
			return true;
		}

		return delete_post_meta( $post->ID, self::DRAFT_META_KEY );
	}

	/**
	 * Restore a revision as active.
	 *
	 * @param int $revision_id The revision ID to restore.
	 * @return int|\WP_Error Post ID on success, WP_Error on failure.
	 */
	public static function restore_revision( $revision_id ) {
		$revision = wp_get_post_revision( $revision_id );

		if ( ! $revision ) {
			return new \WP_Error(
				'invalid_revision',
				__( 'Invalid revision ID.', 'gutenberg' )
			);
		}

		$post = self::get_guidelines_post();

		if ( ! $post || $revision->post_parent !== $post->ID ) {
			return new \WP_Error(
				'revision_mismatch',
				__( 'Revision does not belong to guidelines.', 'gutenberg' )
			);
		}

		// Restore creates a new revision.
		return wp_update_post(
			array(
				'ID'           => $post->ID,
				'post_content' => $revision->post_content,
			),
			true
		);
	}
}
