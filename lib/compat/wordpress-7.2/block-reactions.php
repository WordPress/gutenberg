<?php
/**
 * Emoji reactions targeting blocks for WordPress 7.2.
 *
 * A reaction row (see note-reactions.php for the comment-type rationale)
 * resolves to one of three targets:
 *
 * - a comment, when `comment_parent` is set (today only a `note`);
 * - a block, when `comment_parent` is 0 and the `_wp_reaction_block` meta
 *   carries the block's anchor, the `metadata.reactionsId` attribute the
 *   editor writes on the first reaction;
 * - the post itself, when neither is set. Reserved: the REST layer rejects
 *   it until a read and create policy for post-level reactions exists.
 *
 * Blocks have no server-side identity, so the anchor is minted client-side
 * and lives in `post_content`. A reaction whose anchor no longer appears in
 * the content is simply not rendered; rows are not reconciled on save
 * because a save from stale content would otherwise trash live reactions.
 *
 * @package gutenberg
 * @since   7.2.0
 */

/**
 * Comment meta key holding the block anchor of a block-targeted reaction.
 *
 * @since 7.2.0
 * @var string
 */
const GUTENBERG_REACTION_BLOCK_META_KEY = '_wp_reaction_block';

/**
 * Returns the JSON Schema pattern a block anchor must match.
 *
 * The editor mints anchors as short lowercase base-36 strings; the range
 * leaves room for a longer mint without reopening the schema.
 *
 * @since 7.2.0
 *
 * @return string JSON Schema (ECMA-262) pattern.
 */
function gutenberg_get_reaction_block_anchor_pattern() {
	return '^[a-z0-9]{6,16}$';
}

/**
 * Whether a value is a well-formed block anchor.
 *
 * @since 7.2.0
 *
 * @param mixed $anchor Value to check.
 * @return bool True when the anchor matches the pattern.
 */
function gutenberg_is_valid_reaction_block_anchor( $anchor ) {
	return is_string( $anchor ) && 1 === preg_match( '/' . gutenberg_get_reaction_block_anchor_pattern() . '/', $anchor );
}

/**
 * Sanitizes a block anchor for storage: invalid values become empty.
 *
 * @since 7.2.0
 *
 * @param mixed $value Raw meta value.
 * @return string The anchor, or an empty string.
 */
function gutenberg_sanitize_reaction_block_anchor( $value ) {
	return gutenberg_is_valid_reaction_block_anchor( $value ) ? $value : '';
}

/**
 * Whether a post type supports notes (and therefore reactions).
 *
 * Mirrors the private `check_post_type_supports_notes()` in core's
 * comment controller: `supports['editor']` must be an array carrying a
 * truthy `notes` entry.
 *
 * @since 7.2.0
 *
 * @param string $post_type Post type name.
 * @return bool True if the post type supports notes.
 */
function gutenberg_post_type_supports_notes( $post_type ) {
	$supports = get_all_post_type_supports( $post_type );
	if ( ! isset( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
		return false;
	}
	foreach ( $supports['editor'] as $item ) {
		if ( ! empty( $item['notes'] ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Registers the comment meta that anchors a reaction to a block.
 *
 * Not exposed through REST meta: the comment controller accepts the anchor
 * as a top-level `block` parameter on create, validates it before the
 * uniqueness check, and reactions are immutable afterwards.
 *
 * @since 7.2.0
 */
function gutenberg_register_reaction_block_meta() {
	register_meta(
		'comment',
		GUTENBERG_REACTION_BLOCK_META_KEY,
		array(
			'type'              => 'string',
			'single'            => true,
			'description'       => __( 'The block anchor a reaction targets.', 'gutenberg' ),
			'sanitize_callback' => 'gutenberg_sanitize_reaction_block_anchor',
			'auth_callback'     => '__return_false',
			'show_in_rest'      => false,
		)
	);
}
add_action( 'init', 'gutenberg_register_reaction_block_meta' );

/**
 * Resolves what a reaction targets from its request arguments.
 *
 * @since 7.2.0
 *
 * @param array $args {
 *     Reaction target arguments.
 *
 *     @type int    $post   Post the reaction belongs to.
 *     @type int    $parent Parent comment ID, or 0.
 *     @type string $block  Block anchor, or an empty string.
 * }
 * @return array|WP_Error {
 *     The resolved target, or an error with a `status` of 400.
 *
 *     @type string $type    `comment` or `block`.
 *     @type int    $post_id Post ID.
 *     @type int    $parent  Parent comment ID (0 for a block target).
 *     @type string $block   Block anchor (empty for a comment target).
 * }
 */
function gutenberg_resolve_reaction_target( array $args ) {
	$post_id = isset( $args['post'] ) ? (int) $args['post'] : 0;
	$parent  = isset( $args['parent'] ) ? (int) $args['parent'] : 0;
	$block   = isset( $args['block'] ) ? (string) $args['block'] : '';

	if ( $parent > 0 && '' !== $block ) {
		return new WP_Error(
			'rest_comment_invalid_reaction_target',
			__( 'A reaction can target a note or a block, not both.', 'gutenberg' ),
			array( 'status' => 400 )
		);
	}

	if ( $parent > 0 ) {
		$parent_comment = get_comment( $parent );
		if ( ! $parent_comment || 'note' !== $parent_comment->comment_type ) {
			return new WP_Error(
				'rest_comment_invalid_parent',
				__( 'A reaction must be attached to a note.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		if ( $post_id > 0 && (int) $parent_comment->comment_post_ID !== $post_id ) {
			return new WP_Error(
				'rest_comment_invalid_parent',
				__( 'A reaction must be attached to a note on the same post.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		return array(
			'type'    => 'comment',
			'post_id' => (int) $parent_comment->comment_post_ID,
			'parent'  => $parent,
			'block'   => '',
		);
	}

	if ( '' !== $block ) {
		if ( ! gutenberg_is_valid_reaction_block_anchor( $block ) ) {
			return new WP_Error(
				'rest_comment_invalid_block',
				__( 'Invalid block anchor.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		if ( $post_id <= 0 || ! get_post( $post_id ) ) {
			return new WP_Error(
				'rest_comment_invalid_post_id',
				__( 'A block reaction must belong to a post.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		return array(
			'type'    => 'block',
			'post_id' => $post_id,
			'parent'  => 0,
			'block'   => $block,
		);
	}

	// Reserved third target: the post (or attachment) itself, as a row with
	// neither parent nor anchor. It needs its own read and create policy
	// before the REST layer can accept it, so it is rejected for now.
	return new WP_Error(
		'rest_comment_invalid_reaction_target',
		__( 'A reaction must target a note or a block.', 'gutenberg' ),
		array( 'status' => 400 )
	);
}

/**
 * Reads the target of a stored reaction row.
 *
 * @since 7.2.0
 *
 * @param WP_Comment $reaction The reaction comment.
 * @return array The target, in the shape gutenberg_resolve_reaction_target() returns.
 */
function gutenberg_get_reaction_target_for_comment( WP_Comment $reaction ) {
	$parent = (int) $reaction->comment_parent;
	$block  = (string) get_comment_meta( $reaction->comment_ID, GUTENBERG_REACTION_BLOCK_META_KEY, true );

	return array(
		'type'    => $parent > 0 ? 'comment' : 'block',
		'post_id' => (int) $reaction->comment_post_ID,
		'parent'  => $parent,
		'block'   => $parent > 0 ? '' : $block,
	);
}

/**
 * Builds get_comments() arguments scoped to every reaction on a target.
 *
 * A block target scopes by post and anchor as well as `parent => 0`: on its
 * own, a zero parent matches every top-level comment site-wide.
 *
 * @since 7.2.0
 *
 * @param array $target A resolved reaction target.
 * @param array $args   Further get_comments() arguments (user_id, status, ...).
 * @return array Arguments for get_comments().
 */
function gutenberg_get_reaction_target_query_args( array $target, array $args = array() ) {
	$scope = array(
		'post_id' => (int) $target['post_id'],
		'parent'  => (int) $target['parent'],
		'type'    => 'reaction',
	);

	if ( 'block' === $target['type'] ) {
		$scope['meta_key']   = GUTENBERG_REACTION_BLOCK_META_KEY; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		$scope['meta_value'] = $target['block']; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
	}

	return array_merge( $scope, $args );
}

/**
 * Narrows a reaction listing to one block anchor.
 *
 * Lets the editor name who reacted to a block with
 * `GET /wp/v2/comments?post=<id>&parent=0&type=reaction&block=<anchor>`.
 *
 * @since 7.2.0
 *
 * @param array           $prepared_args WP_Comment_Query arguments.
 * @param WP_REST_Request $request       The request.
 * @return array Possibly narrowed arguments.
 */
function gutenberg_filter_rest_comment_query_by_block( $prepared_args, $request ) {
	$block = $request['block'] ?? '';
	if ( gutenberg_is_valid_reaction_block_anchor( $block ) ) {
		$prepared_args['meta_key']   = GUTENBERG_REACTION_BLOCK_META_KEY; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		$prepared_args['meta_value'] = $block; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
	}
	return $prepared_args;
}
add_filter( 'rest_comment_query', 'gutenberg_filter_rest_comment_query_by_block', 10, 2 );

/**
 * Returns the schema of one entry in a reaction summary.
 *
 * Shared by the note `reaction_summary` and the post `block_reaction_summary`
 * fields so every carrier exposes the same shape.
 *
 * @since 7.2.0
 *
 * @return array JSON Schema for `{ count, reacted, my_reaction_id }`.
 */
function gutenberg_get_reaction_summary_entry_schema() {
	return array(
		'type'       => 'object',
		'properties' => array(
			'count'          => array(
				'description' => __( 'Total number of reactions with this emoji.', 'gutenberg' ),
				'type'        => 'integer',
			),
			'reacted'        => array(
				'description' => __( 'Whether the current user reacted with this emoji.', 'gutenberg' ),
				'type'        => 'boolean',
			),
			'my_reaction_id' => array(
				'description' => __( 'The current user\'s reaction comment ID, or 0 if not reacted.', 'gutenberg' ),
				'type'        => 'integer',
			),
		),
	);
}

/**
 * Aggregates the approved block reactions on a post, keyed by anchor.
 *
 * @since 7.2.0
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param int $post_id Post ID.
 * @param int $user_id User whose own reactions are flagged. Default 0.
 * @return array `{ anchor: { slug: { count, reacted, my_reaction_id } } }`.
 */
function gutenberg_get_block_reaction_summary( $post_id, $user_id = 0 ) {
	global $wpdb;

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT m.meta_value AS block, c.comment_content AS slug, COUNT(*) AS reaction_count,
				MIN( CASE WHEN c.user_id = %d THEN c.comment_ID ELSE NULL END ) AS my_reaction_id
			FROM {$wpdb->comments} c
			INNER JOIN {$wpdb->commentmeta} m ON m.comment_id = c.comment_ID AND m.meta_key = %s
			WHERE c.comment_post_ID = %d
				AND c.comment_parent = 0
				AND c.comment_type = 'reaction'
				AND c.comment_approved = '1'
			GROUP BY m.meta_value, c.comment_content
			ORDER BY m.meta_value, c.comment_content",
			(int) $user_id,
			GUTENBERG_REACTION_BLOCK_META_KEY,
			(int) $post_id
		)
	);

	$summary = array();
	foreach ( (array) $rows as $row ) {
		$anchor         = (string) $row->block;
		$slug           = wp_strip_all_tags( $row->slug );
		$my_reaction_id = (int) $row->my_reaction_id;

		$summary[ $anchor ][ $slug ] = array(
			'count'          => (int) $row->reaction_count,
			'reacted'        => $my_reaction_id > 0,
			'my_reaction_id' => $my_reaction_id,
		);
	}

	return $summary;
}

/**
 * REST callback for the `block_reaction_summary` post field.
 *
 * Computed for single-item requests only, so a list of posts never runs one
 * aggregate query per row; the editor reads the field from the single post it
 * edits. A collection's `null` is stripped by
 * gutenberg_omit_block_reaction_summary_from_collections().
 *
 * @since 7.2.0
 *
 * @param array           $post       Prepared post data.
 * @param string          $field_name Field name.
 * @param WP_REST_Request $request    The request.
 * @return array|null The summary, or null when not computed.
 */
function gutenberg_get_block_reaction_summary_field( $post, $field_name, $request ) {
	$post_id = (int) ( $request['id'] ?? 0 );
	if ( $post_id <= 0 ) {
		return null;
	}

	return gutenberg_get_block_reaction_summary( $post_id, get_current_user_id() );
}

/**
 * Registers `block_reaction_summary` on every REST-enabled post type that
 * supports notes.
 *
 * `edit` context only: reading a post in that context already requires
 * `edit_post`, which is the same capability reacting needs.
 *
 * @since 7.2.0
 */
function gutenberg_register_block_reaction_summary_field() {
	$post_types = array_values(
		array_filter(
			get_post_types( array( 'show_in_rest' => true ), 'names' ),
			'gutenberg_post_type_supports_notes'
		)
	);

	if ( empty( $post_types ) ) {
		return;
	}

	register_rest_field(
		$post_types,
		'block_reaction_summary',
		array(
			'get_callback' => 'gutenberg_get_block_reaction_summary_field',
			'schema'       => array(
				'description'          => __( 'Aggregated reaction counts for each block in this post, keyed by block anchor and then by emoji slug. Only present on single-item requests.', 'gutenberg' ),
				'type'                 => array( 'object', 'null' ),
				'context'              => array( 'edit' ),
				'readonly'             => true,
				'additionalProperties' => array(
					'type'                 => 'object',
					'additionalProperties' => gutenberg_get_reaction_summary_entry_schema(),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_block_reaction_summary_field' );

/**
 * Removes the uncomputed `block_reaction_summary` from collection responses.
 *
 * Clients cache single and collection responses in one per-record store, so
 * a `null` placeholder from a collection would overwrite the summary already
 * loaded for the post being edited.
 *
 * @since 7.2.0
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     Post object.
 * @param WP_REST_Request  $request  Request object.
 * @return WP_REST_Response The response without the placeholder field.
 */
function gutenberg_omit_block_reaction_summary_from_collections( $response, $post, $request ) {
	if ( ! empty( $request['id'] ) || ! $response instanceof WP_REST_Response ) {
		return $response;
	}

	$data = $response->get_data();
	if ( is_array( $data ) && array_key_exists( 'block_reaction_summary', $data ) ) {
		unset( $data['block_reaction_summary'] );
		$response->set_data( $data );
	}

	return $response;
}

/**
 * Hooks gutenberg_omit_block_reaction_summary_from_collections() for every
 * REST-enabled post type that supports notes.
 *
 * @since 7.2.0
 */
function gutenberg_register_block_reaction_summary_collection_filters() {
	foreach ( get_post_types( array( 'show_in_rest' => true ), 'names' ) as $post_type ) {
		if ( gutenberg_post_type_supports_notes( $post_type ) ) {
			add_filter( "rest_prepare_{$post_type}", 'gutenberg_omit_block_reaction_summary_from_collections', 10, 3 );
		}
	}
}
add_action( 'init', 'gutenberg_register_block_reaction_summary_collection_filters', 99 );
