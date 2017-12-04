<?php
/**
 * Annotations API: WP_Annotation_Utils class
 *
 * @package gutenberg
 * @since [version]
 */

/**
 * Annotation utilities.
 *
 * Annotations are stored as comments with a custom comment type.
 *
 * @since [version]
 */
final class WP_Annotation_Utils {
	/**
	 * Valid annotation types.
	 *
	 * The first item in this array serves as the default comment type for annotations.
	 * Other comment types can be added in the future by simply adding them to this
	 * array. Upon doing so, the REST API for annotations (along with annotation
	 * permission checks) will consider those types to be annotations too.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 */
	public static $types = array(
		'annotation',       // Front-end.
		'admin_annotation', // Back-end.
	);

	/**
	 * Allowed annotation types.
	 *
	 * @internal As a security precaution, front-end annotations are disabled for now.
	 * Once front-end annotations are allowed, this property could be removed and {@see
	 * WP_Annotation_Utils::is_valid_type()} can be updated to use the {@see
	 * WP_Annotation_Utils::$types} property instead.
	 *
	 * @internal Front-end annotations can only be created by anomymous users via the
	 * REST API if the {@see 'rest_allow_anonymous_comments'} filter is true.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 *
	 * @see WP_Annotation_Utils::is_valid_type()
	 */
	protected static $allow_types = array(
		// 'annotation',    Disabled for now.
		'admin_annotation', // Back-end.
	);

	/**
	 * Valid annotation selectors.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 *
	 * @link https://www.w3.org/TR/annotation-model/#selectors
	 */
	public static $selectors = array(
		'FragmentSelector',
		'CssSelector',
		'XPathSelector',
		'TextQuoteSelector',
		'TextPositionSelector',
		'DataPositionSelector',
		'SvgSelector',
		'RangeSelector',
	);

	/**
	 * Allowed annotation selectors.
	 *
	 * @internal As a security precaution, SVG selectors are disabled for now. If SVG is
	 * enabled in the future, be sure to enhance the SVG markup validation sub-routine
	 * found in {@see WP_Annotation_Utils::is_valid_selector()}.
	 *
	 * @internal Also, once SVG selectors are allowed, this property could be removed and
	 * {@see WP_Annotation_Utils::is_valid_selector()} can be updated to use the {@see
	 * WP_Annotation_Utils::$selectors} property instead.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 *
	 * @see WP_Annotation_Utils::is_valid_selector()
	 *
	 * @link https://www.w3.org/TR/annotation-model/#selectors
	 */
	protected static $allow_selectors = array(
		'FragmentSelector',
		'CssSelector',
		'XPathSelector',
		'TextQuoteSelector',
		'TextPositionSelector',
		'DataPositionSelector',
		// 'SvgSelector', Disabled for now.
		'RangeSelector',
	);

	/**
	 * Custom annotation statuses.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 */
	public static $custom_statuses = array(
		'resolve', // Archived as resolved.
		'reject',  // Archived as rejected.
		'archive', // Archived for another reason.
	);

	/**
	 * Maps annotation meta-caps and pseudo-caps.
	 *
	 * Annotations are stored as comments with a custom comment type. Annotation
	 * permissions sometimes resemble those associated with other comment types, but at
	 * other times (e.g., back-end annotations) they absolutely are not like other
	 * comments. So these additional caps offer a standard method by which to check
	 * annotation permissions.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 * @param array  $args    Arguments to {@see map_meta_cap()}.
	 *
	 * @return array          Array of required capabilities.
	 */
	public static function on_map_meta_cap( $caps, $cap, $user_id, $args ) {
		switch ( $cap ) {
			/*
			 * Requires $args[0], $args[1] with post ID and comment type.
			 */
			case 'create_annotation': // This is a custom annotation meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0], $args[1] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id = absint( $user_id );
				$post_id = absint( $args[0] );

				$comment_type = (string) $args[1];
				$post_info    = self::get_post_info( $post_id );

				if ( ! $comment_type || ! $post_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$post        = $post_info['post'];
				$post_type   = $post_info['post_type'];
				$post_status = $post_info['post_status'];

				/*
				 * Check if annotation comment type is valid.
				 */
				if ( ! self::is_valid_type( $comment_type ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Cannot annotate if post is in the trash.
				 */
				if ( 'trash' === $post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If creating a front-end annotation in a post having a public or private status, and the
				 * user can read & comment on the post, then they can create front-end annotations. Note:
				 * Callers should also check if {@see post_password_required()} before allowing access.
				 */
				if ( 'annotation' === $comment_type // Front-end.
						&& ( $post_status->public || $post_status->private )
						&& post_type_supports( $post_type->name, 'comments' ) && comments_open( $post )
						&& ( $user_id || ! get_option( 'comment_registration' ) ) ) {
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->read_post, $user_id, $post->ID ) );

					if ( $post_status->public && ! get_option( 'comment_registration' ) && array( 'read' ) === $caps ) {
						// If post is public, comment registration is off, and post only requires 'read' access.
						$caps = array(); // Allow anonymous public access.
					}
					return $caps;
				}

				/*
				 * If creating a back-end annotation in a post authored by this user, and the user can edit
				 * a post of type, then they can create back-end annotations. For example, a contributor
				 * can create back-end annotations in any post they authored, even if they can no longer
				 * *edit* the post itself; e.g., after it's approved/published.
				 */
				if ( 'annotation' !== $comment_type && $user_id && (int) $post->post_author === $user_id ) {
					return array_merge( $caps, map_meta_cap( $post_type->cap->edit_posts, $user_id ) );
				}

				/*
				 * Otherwise, requires ability to edit post containing the annotation.
				 */
				return array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );

			/*
			 * Requires $args[0] with the annotation's comment ID.
			 */
			case 'read_annotation': // An annotation's 'read_post' meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id      = absint( $user_id );
				$comment_id   = absint( $args[0] );
				$comment_info = self::get_comment_info( $comment_id );

				if ( ! $comment_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$comment        = $comment_info['comment'];
				$comment_type   = $comment_info['comment_type'];
				$comment_status = $comment_info['comment_status'];

				$post        = $comment_info['post'];
				$post_type   = $comment_info['post_type'];
				$post_status = $comment_info['post_status'];

				/*
				 * Check if annotation comment type is valid.
				 */
				if ( ! self::is_valid_type( $comment_type ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Cannot read annotation if post is in the trash.
				 */
				if ( 'trash' === $post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If it's an unapproved front-end annotation in a public or private post, and the user can
				 * read the post and moderate comments, they can read the annotation. Note: Callers should
				 * also check if {@see post_password_required()}.
				 */
				if ( 'annotation' === $comment_type && 'approved' !== $comment_status
						&& ( $post_status->public || $post_status->private ) ) {
					$caps   = array_merge( $caps, map_meta_cap( $post_type->cap->read_post, $user_id, $post->ID ) );
					$caps[] = 'moderate_comments';

					return $caps;
				}

				/*
				 * If it's an approved front-end annotation in a public or private post, and the user can
				 * read the post, then they can read the approved front-end annotation. Note: Callers
				 * should also check if {@see post_password_required()} before allowing access.
				 */
				if ( 'annotation' === $comment_type && 'approved' === $comment_status
						&& ( $post_status->public || $post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->read_post, $user_id, $post->ID ) );

					if ( $post_status->public && array( 'read' ) === $caps ) {
						// If both are public and the post only requires 'read' access.
						$caps = array(); // Allow anonymous public access.
					}
					return $caps;
				}

				/*
				 * Add required caps based on the comment's status.
				 */
				$actual_comment_status = $comment_status; // Before meta status.

				if ( in_array( $comment_status, array( 'spam', 'trash' ), true ) ) {
					// When in spam or trash, test the would-be restoration status.
					$wp_trash_meta_status = get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
					$wp_trash_meta_status = $wp_trash_meta_status ? $wp_trash_meta_status : '0';
					$comment_status       = self::translate_comment_status( $wp_trash_meta_status );
				}
				if ( in_array( $actual_comment_status, array( 'unapproved', 'spam' ), true )
						|| in_array( $comment_status, array( 'unapproved', 'spam' ), true ) ) {
					// Requires an adminstrator who can edit others posts, of the specific post type.
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->edit_others_posts, $user_id, $post->ID ) );
				}

				/*
				 * If it's a back-end annotation in a post authored by this user, and the user can edit a
				 * post of type, then they can read back-end annotations. For example, a contributor can
				 * read back-end annotations in any post they authored, even if they can no longer *edit*
				 * the post itself; e.g., after it's approved/published.
				 */
				if ( 'annotation' !== $comment_type && $user_id && (int) $post->post_author === $user_id ) {
					return array_merge( $caps, map_meta_cap( $post_type->cap->edit_posts, $user_id ) );
				}

				/*
				 * Otherwise, requires ability to edit post containing the annotation.
				 */
				return array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );

			/*
			 * Optionally supports $args[0], $args[1] with post ID and comment type.
			 */
			case 'read_annotations': // An annotation's 'read' pseudo-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0], $args[1] ) ) {
					$caps[] = 'edit_posts';
					return $caps;
				}
				$user_id = absint( $user_id );
				$post_id = absint( $args[0] );

				$comment_type = (string) $args[1];
				$post_info    = self::get_post_info( $post_id );

				if ( ! $comment_type || ! $post_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$post        = $post_info['post'];
				$post_type   = $post_info['post_type'];
				$post_status = $post_info['post_status'];

				/*
				 * Check if annotation comment type is valid.
				 */
				if ( ! self::is_valid_type( $comment_type ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Cannot read annotations if post is in the trash.
				 */
				if ( 'trash' === $post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If reading front-end annotations in a public or private post, and the user can read the
				 * post, then they can read annotations. Note: Callers should also check if {@see
				 * post_password_required()}.
				 */
				if ( 'annotation' === $comment_type // Front-end.
						&& ( $post_status->public || $post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->read_post, $user_id, $post->ID ) );

					if ( $post_status->public && array( 'read' ) === $caps ) {
						// If post is public and only requires 'read' access.
						$caps = array(); // Allow anonymous public access.
					}
					return $caps;
				}

				/*
				 * If reading back-end annotations in a post authored by this user, and the user can edit a
				 * post of type, then they can read back-end annotations. For example, a contributor can
				 * read back-end annotations in any post they authored, even if they can no longer *edit*
				 * the post itself; e.g., after it's approved/published.
				 */
				if ( 'annotation' !== $comment_type && $user_id && (int) $post->post_author === $user_id ) {
					return array_merge( $caps, map_meta_cap( $post_type->cap->edit_posts, $user_id ) );
				}

				/*
				 * Otherwise, requires ability to edit post containing the annotations.
				 */
				return array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );

			/*
			 * Requires $args[0] with the annotation's post ID.
			 */
			case 'edit_annotation': // An annotation's 'edit_post' meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id      = absint( $user_id );
				$comment_id   = absint( $args[0] );
				$comment_info = self::get_comment_info( $comment_id );

				if ( ! $comment_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$comment        = $comment_info['comment'];
				$comment_type   = $comment_info['comment_type'];
				$comment_status = $comment_info['comment_status'];

				$post        = $comment_info['post'];
				$post_type   = $comment_info['post_type'];
				$post_status = $comment_info['post_status'];

				/*
				 * Check if annotation comment type is valid.
				 */
				if ( ! self::is_valid_type( $comment_type ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Cannot edit annotation if post is in the trash.
				 */
				if ( 'trash' === $post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If it's a front-end annotation (with any status) in a public or private post, and the
				 * user can read the post and moderate comments, they can edit. Note: Callers should also
				 * check if {@see post_password_required()}.
				 */
				if ( 'annotation' === $comment_type // Front-end.
						&& ( $post_status->public || $post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->read_post, $user_id, $post->ID ) );

					/*
					 * If the front-end annotation was authored by the specific user, and the user can edit the
					 * post, then they can edit the annotation without the `moderate_comments` cap.
					 */
					if ( $user_id && (int) $comment->user_id === $user_id
							&& user_can( $user_id, $post_type->cap->edit_post, $post->ID ) ) {
						$caps = array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );
					} else {
						$caps[] = 'moderate_comments';
					}

					return $caps;
				}

				/*
				 * Add required caps based on the comment's status.
				 */
				$actual_comment_status = $comment_status; // Before meta status.

				if ( in_array( $comment_status, array( 'spam', 'trash' ), true ) ) {
					// When in spam or trash, test the would-be restoration status.
					$wp_trash_meta_status = get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
					$wp_trash_meta_status = $wp_trash_meta_status ? $wp_trash_meta_status : '0';
					$comment_status       = self::translate_comment_status( $wp_trash_meta_status );
				}
				if ( in_array( $actual_comment_status, array( 'unapproved', 'spam' ), true )
						|| in_array( $comment_status, array( 'unapproved', 'spam' ), true ) ) {
					// Requires an adminstrator who can edit others posts, of the specific post type.
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->edit_others_posts, $user_id, $post->ID ) );
				}

				/*
				 * If it's an annotation authored by this user.
				 */
				if ( $user_id && (int) $comment->user_id === $user_id ) {
					/*
					 * If it's a back-end annotation, and it's also in a post authored by this user, and the user
					 * can edit a post of type, then they can edit their own back-end annotation. For example, a
					 * contributor can edit their own back-end annotation in any post they authored, even if they
					 * can no longer *edit* the post itself; e.g., after it's approved/published.
					 */
					if ( 'annotation' !== $comment_type && (int) $post->post_author === $user_id ) {
						return array_merge( $caps, map_meta_cap( $post_type->cap->edit_posts, $user_id ) );
					}

					/*
					 * Otherwise, requires ability to edit post containing the annotation.
					 */
					return array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );
				}

				/*
				 * Otherwise, requires ability to edit post containing the annotation. Also requires an
				 * adminstrator with the ability to edit others posts, of the specific post type.
				 */
				$caps = array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );
				return array_merge( $caps, map_meta_cap( $post_type->cap->edit_others_posts, $user_id ) );

			/*
			 * Requires $args[0] with the annotation's post ID.
			 */
			case 'delete_annotation': // An annotation's 'delete_post' meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id      = absint( $user_id );
				$comment_id   = absint( $args[0] );
				$comment_info = self::get_comment_info( $comment_id );

				if ( ! $comment_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$comment        = $comment_info['comment'];
				$comment_type   = $comment_info['comment_type'];
				$comment_status = $comment_info['comment_status'];

				$post        = $comment_info['post'];
				$post_type   = $comment_info['post_type'];
				$post_status = $comment_info['post_status'];

				/*
				 * Check if annotation comment type is valid.
				 */
				if ( ! self::is_valid_type( $comment_type ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Cannot delete annotation if post is in the trash.
				 */
				if ( 'trash' === $post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If it's a front-end annotation (with any status) in a public or private post, and the
				 * user can read the post and moderate comments, they can delete. Note: Callers should also
				 * check if {@see post_password_required()}.
				 */
				if ( 'annotation' === $comment_type // Front-end.
						&& ( $post_status->public || $post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->read_post, $user_id, $post->ID ) );

					/*
					 * If the front-end annotation was authored by the specific user, and the user can delete the
					 * post, then they can delete the annotation without the `moderate_comments` cap.
					 */
					if ( $user_id && (int) $comment->user_id === $user_id
							&& user_can( $user_id, $post_type->cap->delete_post, $post->ID ) ) {
						$caps = array_merge( $caps, map_meta_cap( $post_type->cap->delete_post, $user_id, $post->ID ) );
					} else {
						$caps[] = 'moderate_comments';
					}

					return $caps;
				}

				/*
				 * Add required caps based on the comment's status.
				 */
				$actual_comment_status = $comment_status; // Before meta status.

				if ( in_array( $comment_status, array( 'spam', 'trash' ), true ) ) {
					// When in spam or trash, test the would-be restoration status.
					$wp_trash_meta_status = get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
					$wp_trash_meta_status = $wp_trash_meta_status ? $wp_trash_meta_status : '0';
					$comment_status       = self::translate_comment_status( $wp_trash_meta_status );
				}
				if ( in_array( $actual_comment_status, array( 'unapproved', 'spam' ), true )
						|| in_array( $comment_status, array( 'unapproved', 'spam' ), true ) ) {
					// Requires an adminstrator who can delete others posts, of the specific post type.
					$caps = array_merge( $caps, map_meta_cap( $post_type->cap->delete_others_posts, $user_id, $post->ID ) );
				}

				/*
				 * If it's an annotation authored by this user.
				 */
				if ( $user_id && (int) $comment->user_id === $user_id ) {
					/*
					 * If it's a back-end annotation, and it's also in a post authored by this user, and the user
					 * can delete a post of type, then they can delete their own back-end annotation. For
					 * example, a contributor can delete their own back-end annotation in any post they authored,
					 * even if they can no longer *delete* the post itself; e.g., after it's approved/published.
					 */
					if ( 'annotation' !== $comment_type && (int) $post->post_author === $user_id ) {
						return array_merge( $caps, map_meta_cap( $post_type->cap->delete_posts, $user_id ) );
					}

					/*
					 * Otherwise, requires ability to delete post containing the annotation.
					 */
					return array_merge( $caps, map_meta_cap( $post_type->cap->delete_post, $user_id, $post->ID ) );
				}

				/*
				 * Otherwise, requires ability to delete post containing the annotation. Also requires an
				 * adminstrator with the ability to delete others posts, of the specific post type.
				 */
				$caps = array_merge( $caps, map_meta_cap( $post_type->cap->delete_post, $user_id, $post->ID ) );
				return array_merge( $caps, map_meta_cap( $post_type->cap->delete_others_posts, $user_id ) );

			/*
			 * All other pseudo-caps are handled dynamically. These are simply mapped to the
			 * equivalent *_posts cap. Optionally supports $args[0] with an annotation comment type.
			 */
			case 'create_annotations':
			case 'delete_annotations':
			case 'delete_others_annotations':
			case 'delete_private_annotations':
			case 'delete_published_annotations':
			case 'edit_annotations':
			case 'edit_others_annotations':
			case 'edit_private_annotations':
			case 'edit_published_annotations':
			case 'publish_annotations':
			case 'read_private_annotations':
				$caps = array_diff( $caps, array( $cap ) );

				if ( isset( $args[0] ) ) {
					$comment_type = (string) $args[0];

					/*
					 * Check if annotation comment type is valid.
					 */
					if ( ! self::is_valid_type( $comment_type ) ) {
						$caps[] = 'do_not_allow';
						return $caps;
					}

					/*
					 * If checking front-end annotations, and the user can moderate comments, they can do
					 * anything with front-end annotations; e.g., create, read, edit, delete.
					 */
					if ( 'annotation' === $comment_type ) {
						$caps[] = 'moderate_comments';
						return $caps;
					}
				}

				/*
				 * Otherwise, simply map to the equivalent *_posts capability.
				 */
				if ( 'create_annotations' === $cap ) {
					$caps[] = 'edit_posts';
				} else {
					$caps[] = str_replace( 'annotations', 'posts', $cap );
				}

				return $caps;
		}

		return $caps;
	}

	/**
	 * Gets an array of comment (i.e., annotation) info.
	 *
	 * @since [version]
	 *
	 * @param WP_Comment|int $comment Comment (i.e., annotation) object or ID.
	 *
	 * @return array                  Annotation info, including parent post info.
	 *                                Returns an empty array on failure.
	 */
	public static function get_comment_info( $comment ) {
		/*
		 * Collect comment info.
		 */

		if ( ! $comment ) {
			return array();
		}

		$comment = get_comment( $comment );

		if ( ! $comment ) {
			return array();
		}

		if ( ! in_array( $comment->comment_type, self::$types, true ) ) {
			return array(); // Not an annotation.
		}

		$comment_type   = $comment->comment_type;
		$comment_status = self::get_comment_status( $comment );

		if ( ! $comment_type || ! $comment_status ) {
			return array();
		}

		/*
		 * Collect parent post info.
		 */

		if ( ! $comment->comment_post_ID ) {
			return array();
		}

		$post_info = self::get_post_info( $comment->comment_post_ID );

		if ( ! $post_info ) {
			return array();
		}

		$post        = $post_info['post'];
		$post_type   = $post_info['post_type'];
		$post_status = $post_info['post_status'];

		/*
		 * Return all info.
		 */

		return compact(
			'comment',
			'comment_type',
			'comment_status',
			// ---
			'post',
			'post_type',
			'post_status'
		);
	}

	/**
	 * Gets an annotation's parent post info.
	 *
	 * @since [version]
	 *
	 * @param WP_Post|int $post Post object or ID.
	 *
	 * @return array            Array of post info. Empty array on failure.
	 */
	public static function get_post_info( $post ) {
		if ( ! $post ) {
			return array();
		}

		$post = get_post( $post );

		if ( ! $post ) {
			return array();
		}

		if ( 'revision' === $post->post_type ) {
			return array(); // Must not be a revision.
		}

		$post_type   = get_post_type_object( $post->post_type );
		$post_status = get_post_status_object( get_post_status( $post ) );

		if ( ! $post_type || ! $post_status ) {
			return array();
		}

		return compact(
			'post',
			'post_type',
			'post_status'
		);
	}

	/**
	 * Gets comment status (supports custom statuses).
	 *
	 * Unlike {@see wp_get_comment_status()}, this supports custom statuses. Otherwise,
	 * it closely resembles {@see wp_get_comment_status()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|int $comment Comment (i.e., annotation) object or ID.
	 *
	 * @return string|bool             'approved', 'unapproved', 'spam', 'trash', or a
	 *                                 custom status. Returns false on failure.
	 *
	 * @see wp_get_comment_status()
	 */
	public static function get_comment_status( $comment ) {
		if ( ! $comment ) {
			return false;
		}

		$comment = get_comment( $comment );

		if ( ! $comment ) {
			return false;
		}

		$status = $comment->comment_approved;
		$status = self::translate_comment_status( $status );

		return $status ? $status : false;
	}

	/**
	 * Translates/normalizes an annotation's comment status.
	 *
	 * Matches normalized statuses returned by {@see wp_get_comment_status()}.
	 *
	 * @since [version]
	 *
	 * @param  string $status Comment status.
	 *
	 * @return string         'approved', 'unapproved', 'spam', 'trash', or a custom
	 *                        status. Returns an empty string on failure.
	 *
	 * @see wp_get_comment_status()
	 */
	public static function translate_comment_status( $status ) {
		$status = (string) $status;

		switch ( $status ) {
			case 'approved':
			case 'approve':
			case '1':
				return 'approved';

			case 'hold':
			case '0':
				return 'unapproved';
		}

		return $status;
	}

	/**
	 * Sets comment status (supports custom statuses).
	 *
	 * Unlike {@see wp_set_comment_status()}, this supports custom statuses. Otherwise,
	 * it closely resembles {@see wp_set_comment_status()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|int $comment    Comment (i.e., annotation) object or ID.
	 * @param  string         $new_status New comment status. Supports custom statuses.
	 * @param  bool           $error      Whether to return a {@see WP_Error} on failure.
	 *                                    Default is false.
	 *
	 * @return bool|WP_Error              True on success. False (or a {@see WP_Error})
	 *                                    on failure.
	 *
	 * @see wp_set_comment_status()
	 */
	public static function set_comment_status( $comment, $new_status, $error = false ) {
		global $wpdb;

		if ( ! $comment ) {
			if ( $error ) {
				return new WP_Error( 'update_error', __( 'Could not update comment status.', 'gutenberg' ) );
			}
			return false;
		}

		$old_comment = get_comment( $comment );
		$old_comment = $old_comment ? clone $old_comment : null;

		if ( ! $old_comment ) {
			if ( $error ) {
				return new WP_Error( 'update_error', __( 'Could not update comment status.', 'gutenberg' ) );
			}
			return false;
		}

		$new_status     = (string) $new_status;
		$new_raw_status = $new_status; // Before normalizing.
		$old_raw_status = $old_comment->comment_approved;

		switch ( $new_status ) {
			case 'approved':
			case 'approve':
			case '1':
				$new_status = '1';
				add_action( 'wp_set_comment_status', 'wp_new_comment_notify_postauthor' );
				break;

			case 'hold':
			case '0':
				$new_status = '0';
				break;
		}

		if ( ! $wpdb->update( $wpdb->comments, array( 'comment_approved' => $new_status ), array( 'comment_ID' => $old_comment->comment_ID ) ) ) {
			if ( $error ) {
				return new WP_Error( 'db_update_error', __( 'Could not update comment status.', 'gutenberg' ), $wpdb->last_error );
			}
			return false;
		}

		clean_comment_cache( $old_comment->comment_ID );
		$new_comment = get_comment( $old_comment->comment_ID );

		/** This filter is documented in wp-includes/comment.php */
		do_action( 'wp_set_comment_status', $new_comment->comment_ID, $new_raw_status );

		wp_transition_comment_status( $new_raw_status, $old_raw_status, $new_comment );
		wp_update_comment_count( $new_comment->comment_post_ID );

		return true;
	}

	/**
	 * Removes a comment from spam (supports custom restoration statuses).
	 *
	 * Unlike {@see wp_unspam_comment()}, this supports custom restoration statuses.
	 * Otherwise, it closely resembles {@see wp_unspam_comment()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|int $comment Comment (i.e., annotation) object or ID.
	 *
	 * @return bool                    True on success. False on failure.
	 *
	 * @see wp_unspam_comment()
	 */
	public static function unspam_comment( $comment ) {
		if ( ! $comment ) {
			return false;
		}

		$comment = get_comment( $comment );

		if ( ! $comment ) {
			return false;
		}

		/** This action is documented in wp-includes/comment.php */
		do_action( 'unspam_comment', $comment->comment_ID, $comment );

		$status = (string) get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
		$status = $status ? $status : '0';

		if ( self::set_comment_status( $comment, $status ) ) {
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_status' );
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_time' );

			/** This action is documented in wp-includes/comment.php */
			do_action( 'unspammed_comment', $comment->comment_ID, $comment );

			return true;
		}

		return false;
	}

	/**
	 * Removes a comment from trash (supports custom restoration statuses).
	 *
	 * Unlike {@see wp_untrash_comment()}, this supports custom restoration statuses.
	 * Otherwise, it closely resembles {@see wp_untrash_comment()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|int $comment Comment (i.e., annotation) object or ID.
	 *
	 * @return bool                    True on success. False on failure.
	 *
	 * @see wp_untrash_comment()
	 */
	public static function untrash_comment( $comment ) {
		if ( ! $comment ) {
			return false;
		}

		$comment = get_comment( $comment );

		if ( ! $comment ) {
			return false;
		}

		/** This action is documented in wp-includes/comment.php */
		do_action( 'untrash_comment', $comment->comment_ID, $comment );

		$status = (string) get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
		$status = $status ? $status : '0';

		if ( self::set_comment_status( $comment, $status ) ) {
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_time' );
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_status' );

			/** This action is documented in wp-includes/comment.php */
			do_action( 'untrashed_comment', $comment->comment_ID, $comment );

			return true;
		}

		return false;
	}

	/**
	 * Queries additional REST API collection parameters.
	 *
	 * @since [version]
	 *
	 * @param array           $query_vars {@see WP_Query} vars.
	 * @param WP_REST_Request $request    REST API request.
	 *
	 * @return array                      Filtered query args.
	 *
	 * @see WP_Annotation_Utils::on_comments_clauses()
	 * @see WP_REST_Comments_Controller::get_items()
	 */
	public static function on_rest_comment_query( $query_vars, $request ) {
		/*
		 * Only filter REST API endpoint for annotations.
		 */
		if ( ! preg_match( '/\/annotations$/', $request->get_route() ) ) {
			return $query_vars;
		}

		/*
		 * Support hierarchical queries.
		 */
		if ( isset( $request['hierarchical'] ) ) {
			$query_vars['hierarchical'] = $request['hierarchical'];
		}

		/*
		 * This query var serves two purposes:
		 *
		 * 1. It's a flag that we read when filtering comments_clauses, which allows
		 *    annotations to be returned by WP_Comment_Query, or not.
		 *
		 * 2. It defines a separate cache_domain for annotation comment queries, because the
		 *    cache is impacted by this flag, given our comments_clauses filter.
		 *
		 * Thus, when cache_domain is 'annotations', annotations can be returned by
		 * WP_Comment_Query. If cache_domain is not 'annotations', annotation comment types
		 * cannot be returned.
		 */
		$query_vars['cache_domain'] = 'annotations';

		/*
		 * Build meta queries.
		 */
		$meta_queries = array();

		$vias = $request['via'];
		$vias = $vias ? (array) $vias : array();
		$vias = array_map( 'strval', $vias );

		if ( $vias ) {
			$meta_queries[] = array(
				'key'     => '_via',
				'value'   => $vias,
				'compare' => 'IN',
			);
		}

		/*
		 * Preserve an existing meta query.
		 */
		if ( $meta_queries ) {
			if ( ! empty( $query_vars['meta_query'] ) ) {
				$query_vars['meta_query'] = array(
					'relation' => 'AND',
					$query_vars['meta_query'],
					array(
						'relation' => 'AND',
						$meta_queries,
					),
				);
			} else {
				$query_vars['meta_query'] = array(
					'relation' => 'AND',
					$meta_queries,
				);
			}
		}

		return $query_vars;
	}

	/**
	 * Filters WP_Comment_Query clauses.
	 *
	 * @since [version]
	 *
	 * @param  array            $pieces Array of comment query clauses.
	 * @param  WP_Comment_Query $query  Current WP_Comment_Query instance.
	 *
	 * @return array                    Array of comment query clauses.
	 *
	 * @see WP_Annotation_Utils::on_rest_comment_query()
	 * @see WP_Comment_Query::get_comment_ids()
	 */
	public static function on_comments_clauses( $pieces, $query ) {
		global $wpdb;

		/*
		 * When cache_domain is 'annotations', annotations only then can be returned by
		 * WP_Comment_Query. Otherwise, if cache_domain is not 'annotations', annotation
		 * comment types cannot be returned whatsoever.
		 *
		 * The point being that we want to keep annotations out of any normal comment query
		 * performed by core, and also keep them away from comment-related plugins; i.e.,
		 * annotations will be unexpected by most plugins. If a plugin *does* want to query
		 * annotations, they should set cache_domain to 'annotations'.
		 */
		if ( 'annotations' !== $query->query_vars['cache_domain'] ) {
			$annotation_types = self::$types;

			foreach ( $annotation_types as &$_type ) {
				$_type = $wpdb->prepare( '%s', $_type );
			}
			$pieces['where'] .= $pieces['where'] ? ' AND ' : '';
			$pieces['where'] .= 'comment_type NOT IN (' . implode( ', ', $annotation_types ) . ')';
		}

		/*
		 * This works arounds a bug in WP_Comment_Query.
		 *
		 * If 'hierarchical' is not empty, WP_Comment_Query forces 'parent' to '0', even if
		 * 'parent__in' is already defined. That's a problem that we must correct here, because
		 * the REST API uses 'parent__in', not 'parent'. See: <https://git.io/vNc8j>.
		 */
		if ( 'annotations' === $query->query_vars['cache_domain'] && $query->query_vars['hierarchical'] ) {
			// If performing a hierarchical comment query, WP_Comment_Query will set the 'parent' query var
			// to a value of 0 by default; i.e., if it wasn't defined already. That conflicts with 'parent__in'.
			if ( $query->query_vars['parent__in'] && ! $query->query_vars['parent'] ) {

				// So 'parent__in' is not empty, and 'parent' is empty (e.g., 0 or otherwise).
				// Now, if the clause itself contains 'comment_parent IN' as a result of 'parent__in'.
				if ( preg_match( '/\bcomment_parent\s+IN\b/i', $pieces['where'] ) ) {

					// Then remove the conflicting 'comment_parent =' SQL that is brought about by 'parent'.
					// In other words, we want to do away with 'parent' and let 'parent__in' work as expected.
					$pieces['where'] = preg_replace( '/\s+AND\s+comment_parent\s*\=\s*[0-9]+/', '', $pieces['where'] );
				}
			}
		}

		return $pieces;
	}

	/**
	 * Checks an annotation comment type.
	 *
	 * @since [version]
	 *
	 * @param  string $type Comment type.
	 *
	 * @return bool         True if comment is valid.
	 */
	public static function is_valid_type( $type ) {
		/**
		 * Filters comment types allowed for annotations.
		 *
		 * @since [version]
		 *
		 * @param array Comment types allowed for annotations.
		 */
		$allow_types = apply_filters( 'annotation_allow_types', self::$allow_types );

		return is_string( $type ) && in_array( $type, $allow_types, true );
	}

	/**
	 * Checks an annotation comment status.
	 *
	 * @since [version]
	 *
	 * @param  string $status        Comment status.
	 * @param  bool   $allow_actions Allow actions? Default false.
	 *
	 * @return bool                  True if status is valid.
	 */
	public static function is_valid_status( $status, $allow_actions = false ) {
		$allow_statuses = array( 'approved', 'approve', '1', 'hold', '0', 'spam', 'trash' );
		$allow_statuses = array_merge( $allow_statuses, self::$custom_statuses );

		if ( $allow_actions ) {
			$allow_statuses = array_merge( $allow_statuses, array( 'unspam', 'untrash' ) );
		}
		return is_string( $status ) && in_array( $status, $allow_statuses, true );
	}

	/**
	 * Checks an annotation comment status (or status action).
	 *
	 * @since [version]
	 *
	 * @param  string $status Comment status.
	 *
	 * @return bool           True if status is valid.
	 */
	public static function is_valid_status_or_action( $status ) {
		return self::is_valid_status( $status, true );
	}

	/**
	 * Validates a W3C annotation client identifier.
	 *
	 * @since [version]
	 *
	 * @param  string $client The annotation client to check.
	 *
	 * @return bool           True if client is valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#rendering-software
	 */
	public static function is_valid_client( $client ) {
		if ( '' === $client ) {
			return true; // Empty is OK.
		}

		if ( ! is_string( $client ) ) {
			return false;
		}
		$raw_client = $client;
		$client     = preg_replace( '/[^a-z0-9:_\-]/i', '', $client );
		$client     = substr( trim( $client, ':_-' ), 0, 250 );

		if ( ! $client || $client !== $raw_client ) {
			return false;
		}

		return true;
	}

	/**
	 * Validates a W3C annotation selector deeply.
	 *
	 * @since [version]
	 *
	 * @param  array $selector  Selector to check.
	 * @param  bool  $recursive For internal use only.
	 *
	 * @return bool             True if selector is valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#selectors
	 */
	public static function is_valid_selector( $selector, $recursive = false ) {
		if ( ! $recursive && array() === $selector ) {
			return true; // Empty is OK.
		}

		if ( ! $selector || ! is_array( $selector ) ) {
			return false;
		} elseif ( empty( $selector['type'] ) || ! is_string( $selector['type'] ) ) {
			return false;
		} elseif ( 2 < count( array_keys( $selector ) ) ) {
			return false;
		}

		/**
		 * Filters selector types allowed for annotations.
		 *
		 * @since [version]
		 *
		 * @param array Selector types allowed for annotations.
		 */
		$allow_selectors = apply_filters( 'annotation_allow_selectors', self::$allow_selectors );
		if ( ! in_array( $selector['type'], $allow_selectors, true ) ) {
			return false;
		}

		if ( 'RangeSelector' !== $selector['type'] ) {
			if ( 'SvgSelector' === $selector['type'] ) {
				$max_selector_size = 131072; // 128kb.
			} else {
				$max_selector_size = 16384; // 16kb.
			}

			/**
			 * Filters max annotation selector size (in bytes).
			 *
			 * @since [version]
			 *
			 * @param int    Max annotation selector size (in bytes).
			 * @param array  An array of all selector details.
			 */
			$max_selector_size = apply_filters( 'annotation_max_selector_size', $max_selector_size, $selector );

			$selector_minus_refinements = $selector;
			unset( $selector_minus_refinements['refinedBy'] );
			$selector_size = strlen( json_encode( $selector_minus_refinements ) );

			if ( $selector_size > $max_selector_size ) {
				return false;
			}
		}

		switch ( $selector['type'] ) {
			case 'FragmentSelector':
				$allow_keys = array(
					'type',
					'value',
					'conformsTo',
					'refinedBy',
				);
				if ( array_diff_key( $selector, array_fill_keys( $allow_keys, 0 ) ) ) {
					return false;
				} elseif ( empty( $selector['value'] ) || ! is_string( $selector['value'] ) ) {
					return false;
				} elseif ( isset( $selector['conformsTo'] ) && ! wp_parse_url( $selector['conformsTo'] ) ) {
					return false;
				} elseif ( isset( $selector['refinedBy'] ) && ! self::is_valid_selector( $selector['refinedBy'], true ) ) {
					return false;
				}
				return true;

			case 'CssSelector':
			case 'XPathSelector':
				$allow_keys = array(
					'type',
					'value',
					'refinedBy',
				);
				if ( array_diff_key( $selector, array_fill_keys( $allow_keys, 0 ) ) ) {
					return false;
				} elseif ( empty( $selector['value'] ) || ! is_string( $selector['value'] ) ) {
					return false;
				} elseif ( isset( $selector['refinedBy'] ) && ! self::is_valid_selector( $selector['refinedBy'], true ) ) {
					return false;
				}
				return true;

			case 'TextQuoteSelector':
				$allow_keys = array(
					'type',
					'exact',
					'prefix',
					'suffix',
				);
				if ( array_diff_key( $selector, array_fill_keys( $allow_keys, 0 ) ) ) {
					return false;
				} elseif ( ! isset( $selector['exact'] ) || ! is_string( $selector['exact'] ) ) {
					return false;
				} elseif ( isset( $selector['prefix'] ) && ! is_string( $selector['prefix'] ) ) {
					return false;
				} elseif ( isset( $selector['suffix'] ) && ! is_string( $selector['suffix'] ) ) {
					return false;
				} elseif ( '' === $selector['exact'] ) {
					return false;
				}
				return true;

			case 'TextPositionSelector':
			case 'DataPositionSelector':
				$allow_keys = array(
					'type',
					'start',
					'end',
				);
				if ( array_diff_key( $selector, array_fill_keys( $allow_keys, 0 ) ) ) {
					return false;
				} elseif ( ! isset( $selector['start'] ) || ! is_int( $selector['start'] ) || 0 > $selector['start'] ) {
					return false;
				} elseif ( ! isset( $selector['end'] ) || ! is_int( $selector['end'] ) || 0 > $selector['end'] ) {
					return false;
				}
				return true;

			case 'SvgSelector':
				/*
				 * @TODO SVG selectors are disabled for the time being. See {@see
				 * WP_Annotation_Utils::$allow_selectors} for further details.
				 *
				 * Please DO NOT ENABLE until a better security scan can be performed here.
				 */
				$allow_keys = array(
					'type',
					'id',    // URL leading to an SVG file.
					'value', // Inline SVG markup.
				);
				if ( array_diff_key( $selector, array_fill_keys( $allow_keys, 0 ) ) ) {
					return false;
				} elseif ( empty( $selector['id'] ) && empty( $selector['value'] ) ) {
					return false;
				} elseif ( ! empty( $selector['id'] ) && ! wp_parse_url( $selector['id'] ) ) {
					return false;
				} elseif ( ! empty( $selector['value'] ) && ! stripos( (string) $selector['value'], '</svg>' ) === false ) {
					return false;
				}
				return true;

			case 'RangeSelector':
				$allow_keys = array(
					'type',
					'startSelector',
					'endSelector',
				);
				if ( array_diff_key( $selector, array_fill_keys( $allow_keys, 0 ) ) ) {
					return false;
				} elseif ( empty( $selector['startSelector'] ) || empty( $selector['endSelector'] ) ) {
					return false;
				} elseif ( ! self::is_valid_selector( $selector['startSelector'], true ) ) {
					return false;
				} elseif ( ! self::is_valid_selector( $selector['endSelector'], true ) ) {
					return false;
				}
				return true;
		}

		return false;
	}
}
