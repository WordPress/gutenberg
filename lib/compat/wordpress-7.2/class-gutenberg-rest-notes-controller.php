<?php
/**
 * REST API: Gutenberg_REST_Notes_Controller class
 *
 * @package gutenberg
 */

/**
 * Serves editorial notes from a dedicated `wp/v2/notes` collection.
 *
 * Notes are stored as `note` comments, so this controller extends the comments
 * controller and keeps the same underlying object type: the same comment meta,
 * the same `rest_prepare_comment` filter, and the same registered REST fields
 * all continue to apply. What changes is the shape of the collection, which is
 * modelled on how notes are actually used rather than on how comments are:
 *
 * - Notes are always scoped to a post. `post` is required, and access is a
 *   single question - can the current user edit that post?
 * - The collection returns *threads*. Replies are nested under their parent in
 *   a `replies` array instead of being interleaved as sibling rows, so
 *   pagination cuts between threads and never orphans a reply from its parent.
 * - Replies are prepared in the same context as their parent, so a thread
 *   fetched with `context=edit` carries `content.raw` all the way down. The
 *   `_embed` route on `wp/v2/comments` can only return them in `view` context.
 * - `type` is fixed to `note` and `status` defaults to `all`, because a note is
 *   equally interesting whether it is open (`hold`) or resolved (`approved`).
 *
 * Threads are one level deep, matching the editor UI. A reply to a reply would
 * be stored fine but is not nested any further than its top-level ancestor.
 *
 * @since 7.2.0
 *
 * @see WP_REST_Comments_Controller
 */
class Gutenberg_REST_Notes_Controller extends WP_REST_Comments_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->rest_base = 'notes';
	}

	/**
	 * Checks whether the request may list notes.
	 *
	 * Notes live alongside a post and are visible to everyone who can edit that
	 * post, so the check collapses to `edit_post` for every requested post.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_notes_not_logged_in',
				__( 'Sorry, you are not allowed to read notes.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$post_ids = array_filter( array_map( 'absint', (array) $request['post'] ) );

		if ( empty( $post_ids ) ) {
			return new WP_Error(
				'rest_notes_missing_post',
				__( 'Notes must be requested for at least one post.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		foreach ( $post_ids as $post_id ) {
			$check = $this->check_note_post_permission( $post_id );

			if ( is_wp_error( $check ) ) {
				return $check;
			}
		}

		return true;
	}

	/**
	 * Retrieves a collection of note threads.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error otherwise.
	 */
	public function get_items( $request ) {
		/*
		 * `type` and `parent` are not exposed as collection params, so the
		 * comments controller never maps them onto the comment query. They are
		 * pinned here instead: without an explicit `type`, WP_Comment_Query
		 * excludes notes outright.
		 */
		$scope_to_threads = static function ( $prepared_args ) {
			$prepared_args['type']   = 'note';
			$prepared_args['parent'] = 0;

			return $prepared_args;
		};

		add_filter( 'rest_comment_query', $scope_to_threads, PHP_INT_MAX );

		try {
			$response = parent::get_items( $request );
		} finally {
			remove_filter( 'rest_comment_query', $scope_to_threads, PHP_INT_MAX );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $this->attach_replies( $response, $request );
	}

	/**
	 * Retrieves a single note thread.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error otherwise.
	 */
	public function get_item( $request ) {
		$response = parent::get_item( $request );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $this->attach_replies( $response, $request );
	}

	/**
	 * Creates a note.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error otherwise.
	 */
	public function create_item( $request ) {
		$request['type'] = 'note';

		return parent::create_item( $request );
	}

	/**
	 * Checks whether the request may create a note.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$request['type'] = 'note';

		return parent::create_item_permissions_check( $request );
	}

	/**
	 * Gets the note for a given ID, rejecting comments of any other type.
	 *
	 * Guards the single-note routes so `wp/v2/notes/<id>` cannot be used to read
	 * or edit an ordinary comment that happens to share the ID space.
	 *
	 * @param int $id Supplied ID.
	 * @return WP_Comment|WP_Error Comment object if the ID is a note, WP_Error otherwise.
	 */
	protected function get_comment( $id ) {
		$comment = parent::get_comment( $id );

		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		if ( 'note' !== $comment->comment_type ) {
			return new WP_Error(
				'rest_note_invalid_id',
				__( 'Invalid note ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		return $comment;
	}

	/**
	 * Prepares links for a note.
	 *
	 * Drops the `children` link the comments controller builds. Replies already
	 * travel inside the response, and assembling that link costs a `COUNT` query
	 * per note - the single most expensive part of rendering a large thread list.
	 *
	 * @param WP_Comment $comment Comment object.
	 * @return array Links for the given note.
	 */
	protected function prepare_links( $comment ) {
		$links = parent::prepare_links( $comment );

		unset( $links['children'] );

		return $links;
	}

	/**
	 * Retrieves the note schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		/*
		 * The schema title stays `comment`: a note is a comment record, so
		 * comment meta and anything registered through
		 * `register_rest_field( 'comment', ... )` must keep applying here.
		 */
		$schema = parent::get_item_schema();

		// Notes are authored by logged-in users, so the anonymous-commenter
		// identity fields never carry a value, and a note has no permalink.
		unset(
			$schema['properties']['author_email'],
			$schema['properties']['author_ip'],
			$schema['properties']['author_url'],
			$schema['properties']['author_user_agent'],
			$schema['properties']['link']
		);

		$schema['properties']['reply_count'] = array(
			'description' => __( 'The number of replies written in the thread, not counting the entries that record a resolution.', 'gutenberg' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
		);

		$schema['properties']['replies'] = array(
			'description' => __( 'The replies in the thread, oldest first.', 'gutenberg' ),
			'type'        => 'array',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
			'items'       => array(
				'type' => 'object',
			),
		);

		return $schema;
	}

	/**
	 * Retrieves the query params for the notes collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		// A note is always read by someone editing the post it belongs to.
		$query_params['context']['default'] = 'edit';

		// The collection is threads-only and always `note` typed, so the params
		// that would let a client ask for anything else are not exposed.
		unset(
			$query_params['type'],
			$query_params['parent'],
			$query_params['parent_exclude'],
			$query_params['author_email'],
			$query_params['password']
		);

		// Dropping the default is what makes `required` bite: an empty array
		// would otherwise satisfy the presence check.
		unset( $query_params['post']['default'] );
		$query_params['post']['required'] = true;

		// Open and resolved notes are both interesting; `approve` is not a
		// useful default for a collection that models a review workflow.
		$query_params['status']['default'] = 'all';

		return $query_params;
	}

	/**
	 * Confirms a post exists, supports notes, and is editable by the current user.
	 *
	 * @param int $post_id Post ID.
	 * @return true|WP_Error True when notes on the post are readable, WP_Error otherwise.
	 */
	protected function check_note_post_permission( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid post ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		if ( ! $this->post_type_supports_notes( $post->post_type ) ) {
			return new WP_Error(
				'rest_note_not_supported_post_type',
				__( 'Sorry, this post type does not support notes.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error(
				'rest_cannot_read_notes',
				__( 'Sorry, you are not allowed to read notes for this post.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Determines whether a post type opts into notes.
	 *
	 * Mirrors the private check in the comments controller, which cannot be
	 * reused from a subclass.
	 *
	 * @param string $post_type Post type name.
	 * @return bool True when the post type's editor support declares notes.
	 */
	protected function post_type_supports_notes( $post_type ) {
		$supports = get_all_post_type_supports( $post_type );

		if ( empty( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
			return false;
		}

		foreach ( $supports['editor'] as $editor_support ) {
			if ( ! empty( $editor_support['notes'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Nests each thread's replies into the prepared response.
	 *
	 * Replies for the whole page are fetched in one query, so the cost does not
	 * grow with the number of threads on the page.
	 *
	 * @param WP_REST_Response $response Prepared response holding one thread or a page of them.
	 * @param WP_REST_Request  $request  Full details about the request.
	 * @return WP_REST_Response Response with `replies` and `reply_count` filled in.
	 */
	protected function attach_replies( $response, $request ) {
		if ( $request->is_method( 'HEAD' ) ) {
			return $response;
		}

		$fields       = $this->get_fields_for_response( $request );
		$want_replies = rest_is_field_included( 'replies', $fields );
		$want_count   = rest_is_field_included( 'reply_count', $fields );

		if ( ! $want_replies && ! $want_count ) {
			return $response;
		}

		$data      = $response->get_data();
		$is_single = ! wp_is_numeric_array( $data );
		$threads   = $is_single ? array( $data ) : $data;

		$thread_ids = array();
		foreach ( $threads as $thread ) {
			// `_fields` can omit the ID, and without it there is nothing to
			// hang replies off of.
			if ( isset( $thread['id'] ) ) {
				$thread_ids[] = (int) $thread['id'];
			}
		}

		if ( empty( $thread_ids ) ) {
			return $response;
		}

		list( $replies_by_parent, $counts_by_parent ) = $this->get_replies( $thread_ids, $request );

		foreach ( $threads as $index => $thread ) {
			if ( ! isset( $thread['id'] ) ) {
				continue;
			}

			if ( $want_replies ) {
				$threads[ $index ]['replies'] = isset( $replies_by_parent[ $thread['id'] ] ) ? $replies_by_parent[ $thread['id'] ] : array();
			}

			if ( $want_count ) {
				$threads[ $index ]['reply_count'] = isset( $counts_by_parent[ $thread['id'] ] ) ? $counts_by_parent[ $thread['id'] ] : 0;
			}
		}

		$response->set_data( $is_single ? $threads[0] : $threads );

		return $response;
	}

	/**
	 * Fetches and prepares the replies belonging to a set of threads.
	 *
	 * @param int[]           $thread_ids Top-level note IDs.
	 * @param WP_REST_Request $request    Full details about the request.
	 * @return array {
	 *     Two maps, both keyed by parent note ID.
	 *
	 *     @type array $0 Prepared reply arrays, oldest first.
	 *     @type array $1 Written reply counts.
	 * }
	 */
	protected function get_replies( $thread_ids, $request ) {
		$query = new WP_Comment_Query();

		$replies = $query->query(
			array(
				'parent__in'                => $thread_ids,
				'type'                      => 'note',
				'status'                    => 'all',
				'orderby'                   => 'comment_date_gmt',
				'order'                     => 'ASC',
				'number'                    => 0,
				'no_found_rows'             => true,
				'update_comment_post_cache' => true,
			)
		);

		$replies_by_parent = array();
		$counts_by_parent  = array();

		foreach ( $replies as $reply ) {
			if ( ! $this->check_read_permission( $reply, $request ) ) {
				continue;
			}

			$parent_id = (int) $reply->comment_parent;

			$prepared = $this->prepare_item_for_response( $reply, $request );

			$replies_by_parent[ $parent_id ][] = $this->prepare_response_for_collection( $prepared );

			/*
			 * Resolving or reopening a thread records a reply of its own, marked
			 * with `_wp_note_status`. The thread needs those to render its
			 * history, but they are not something anyone wrote, so they stay out
			 * of the count a caller shows as "N replies". The meta cache is
			 * primed by the query above, so this costs no extra round trip.
			 */
			if ( '' === (string) get_comment_meta( $reply->comment_ID, '_wp_note_status', true ) ) {
				$counts_by_parent[ $parent_id ] = isset( $counts_by_parent[ $parent_id ] ) ? $counts_by_parent[ $parent_id ] + 1 : 1;
			}
		}

		return array( $replies_by_parent, $counts_by_parent );
	}
}
