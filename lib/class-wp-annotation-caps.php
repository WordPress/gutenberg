<?php
/**
 * Annotations API: WP_Annotation_Caps class
 *
 * @package gutenberg
 * @since [version]
 */

/**
 * Annotation capabilities.
 *
 * @since [version]
 */
final class WP_Annotation_Caps {
	/**
	 * Maps annotation caps.
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
			case 'create_annotation':
			case 'read_annotation':
			case 'read_annotations':
			case 'edit_annotation':
			case 'delete_annotation':
				$map = __CLASS__ . '::map_' . $cap;
				return call_user_func( $map, $caps, $cap, $user_id, $args );

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
				return self::map_others( $caps, $cap, $user_id, $args );
		}

		return $caps;
	}

	/**
	 * Maps the 'create_annotation' meta-cap.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 *
	 * @param array  $args {
	 *     Arguments that were passed to {@see map_meta_cap()}.
	 *
	 *     @type int    $post_id Required post ID at index `[0]`.
	 *     @type string $type    Optional annotation type at index `[1]`.
	 *                           If not set, defaults to 'annotation'.
	 * }
	 * @return array          Array of required capabilities.
	 */
	protected static function map_create_annotation( $caps, $cap, $user_id, $args ) {
		$user_id = absint( $user_id );
		$caps    = array_diff( $caps, array( $cap ) );

		if ( ! isset( $args[0] ) ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		if ( isset( $args[1] ) && ! WP_Annotation_Utils::is_valid_type( $args[1] ) ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		$post_id     = absint( $args[0] );
		$post        = $post_id ? get_post( $post_id ) : null;
		$post_type   = $post ? get_post_type_object( $post->post_type ) : null;
		$post_status = $post ? get_post_status_object( get_post_status( $post ) ) : null;

		if ( ! $post || ! $post_type || ! $post_status ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		if ( 'trash' === $post_status->name ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		/*
		 * For example, a contributor can annotate a post they authored, even if they can no
		 * longer edit the post itself; e.g., after it's approved/published.
		 */
		if ( $user_id && (int) $post->post_author === $user_id ) {
			return array_merge( $caps, map_meta_cap( $post_type->cap->edit_posts, $user_id ) );
		}

		return array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );
	}

	/**
	 * Maps the 'read_annotation' meta-cap.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 *
	 * @param array  $args {
	 *     Arguments that were passed to {@see map_meta_cap()}.
	 *
	 *     @type int $id Required annotation ID at index `[0]`.
	 * }
	 * @return array          Array of required capabilities.
	 */
	protected static function map_read_annotation( $caps, $cap, $user_id, $args ) {
		$user_id = absint( $user_id );
		$caps    = array_diff( $caps, array( $cap ) );

		if ( ! isset( $args[0] ) ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		$annotation  = get_annotation( absint( $args[0] ) );
		$post        = $annotation ? $annotation->get_post() : null;
		$post_type   = $annotation ? $annotation->get_post_type() : null;
		$post_status = $annotation ? $annotation->get_post_status() : null;

		if ( ! $annotation || ! $post || ! $post_type || ! $post_status ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		if ( 'trash' === $post_status->name ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		/*
		 * If it's in the trash and they're not the author, or if it's spam, or it's been held
		 * for moderation, then access requires the ability to edit others posts.
		 */
		if ( ( 'trash' === $annotation->status && ( ! $user_id || (int) $annotation->user_id !== $user_id ) )
				|| in_array( $annotation->status, array( 'unapproved', 'spam' ), true )
				|| in_array( $annotation->meta_status, array( 'unapproved', 'spam' ), true ) ) {
			$caps = array_merge( $caps, map_meta_cap( $post_type->cap->edit_others_posts, $user_id, $post->ID ) );
		}

		/*
		 * For example, a contributor can read annotations in a post they authored, even if
		 * they can no longer edit the post itself; e.g., after it's approved/published.
		 */
		if ( $user_id && (int) $post->post_author === $user_id ) {
			return array_merge( $caps, map_meta_cap( $post_type->cap->edit_posts, $user_id ) );
		}

		return array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );
	}

	/**
	 * Maps the 'read_annotations' pseudo-cap.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 *
	 * @param array  $args {
	 *     Arguments that were passed to {@see map_meta_cap()}.
	 *
	 *     @type int    $post_id Optional post ID at index `[0]`.
	 *                           If not set, simply maps to 'edit_posts'.
	 *     @type string $type    Optional annotation type at index `[1]`.
	 *                           If not set, defaults to 'annotation'.
	 * }
	 * @return array          Array of required capabilities.
	 */
	protected static function map_read_annotations( $caps, $cap, $user_id, $args ) {
		$user_id = absint( $user_id );
		$caps    = array_diff( $caps, array( $cap ) );

		if ( ! isset( $args[0] ) ) {
			$caps[] = 'edit_posts';
			return $caps;
		}

		if ( isset( $args[1] ) && ! WP_Annotation_Utils::is_valid_type( $args[1] ) ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		$post_id     = absint( $args[0] );
		$post        = $post_id ? get_post( $post_id ) : null;
		$post_type   = $post ? get_post_type_object( $post->post_type ) : null;
		$post_status = $post ? get_post_status_object( get_post_status( $post ) ) : null;

		if ( ! $post || ! $post_type || ! $post_status ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		if ( 'trash' === $post_status->name ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		/*
		 * For example, a contributor can read annotations in a post they authored, even if
		 * they can no longer edit the post itself; e.g., after it's approved/published.
		 */
		if ( $user_id && (int) $post->post_author === $user_id ) {
			return array_merge( $caps, map_meta_cap( $post_type->cap->edit_posts, $user_id ) );
		}

		return array_merge( $caps, map_meta_cap( $post_type->cap->edit_post, $user_id, $post->ID ) );
	}

	/**
	 * Maps the 'edit_annotation' meta-cap.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 *
	 * @param array  $args {
	 *     Arguments that were passed to {@see map_meta_cap()}.
	 *
	 *     @type int $id Required annotation ID at index `[0]`.
	 * }
	 * @param string $action  'edit' or 'delete'. Default is 'edit'.
	 *
	 * @return array          Array of required capabilities.
	 */
	protected static function map_edit_annotation( $caps, $cap, $user_id, $args, $action = 'edit' ) {
		$user_id = absint( $user_id );
		$caps    = array_diff( $caps, array( $cap ) );

		if ( ! isset( $args[0] ) ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		$annotation  = get_annotation( absint( $args[0] ) );
		$post        = $annotation ? $annotation->get_post() : null;
		$post_type   = $annotation ? $annotation->get_post_type() : null;
		$post_status = $annotation ? $annotation->get_post_status() : null;

		if ( ! $annotation || ! $post || ! $post_type || ! $post_status ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		if ( 'trash' === $post_status->name ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		if ( $user_id && (int) $annotation->user_id === $user_id ) {
			/*
			 * If it's spam, or held, require ability to edit others posts.
			 */
			if ( in_array( $annotation->status, array( 'unapproved', 'spam' ), true )
					|| in_array( $annotation->meta_status, array( 'unapproved', 'spam' ), true ) ) {
				$caps = array_merge( $caps, map_meta_cap( $post_type->cap->{ $action . '_others_posts' }, $user_id, $post->ID ) );
			}

			/*
			 * For example, a contributor can edit their own annotation in a post they authored, even
			 * if they can no longer edit the post itself; e.g., after it's approved/published.
			 */
			if ( $user_id && (int) $post->post_author === $user_id ) {
				return array_merge( $caps, map_meta_cap( $post_type->cap->{ $action . '_posts' }, $user_id ) );
			}

			return array_merge( $caps, map_meta_cap( $post_type->cap->{ $action . '_post' }, $user_id, $post->ID ) );
		}

		return array_merge( $caps,
			map_meta_cap( $post_type->cap->{ $action . '_post' }, $user_id, $post->ID ),
			map_meta_cap( $post_type->cap->{ $action . '_others_posts' }, $user_id )
		);
	}

	/**
	 * Maps the 'delete_annotation' meta-cap.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 * @param array  $args    Arguments that were passed to {@see map_meta_cap()}.
	 *
	 * @return array          Array of required capabilities.
	 */
	protected static function map_delete_annotation( $caps, $cap, $user_id, $args ) {
		return self::map_edit_annotation( $caps, $cap, $user_id, $args, 'delete' );
	}

	/**
	 * Maps other annotation caps.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 *
	 * @param array  $args {
	 *     Arguments that were passed to {@see map_meta_cap()}.
	 *
	 *     @type string $type Optional annotation type at index `[0]`.
	 *                        If not set, defaults to 'annotation'.
	 * }
	 * @return array          Array of required capabilities.
	 */
	protected static function map_others( $caps, $cap, $user_id, $args ) {
		$caps = array_diff( $caps, array( $cap ) );

		if ( isset( $args[0] ) && ! WP_Annotation_Utils::is_valid_type( $args[0] ) ) {
			$caps[] = 'do_not_allow';
			return $caps;
		}

		if ( 'create_annotations' === $cap ) {
			$caps[] = 'edit_posts';
		} else {
			$caps[] = str_replace( 'annotations', 'posts', $cap );
		}

		return $caps;
	}
}
