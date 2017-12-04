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
 * Annotations are stored as posts with a custom post type.
 *
 * @since [version]
 */
final class WP_Annotation_Utils {

	/**
	 * Annotation post type.
	 *
	 * @since [version]
	 *
	 * @var string
	 */
	public static $post_type = 'wp_annotation';

	/**
	 * Valid parent post targets.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 */
	public static $parent_post_targets = array(
		'',      // Default (front-end).
		'admin', // Back-end.
	);

	/**
	 * Allowed parent post targets.
	 *
	 * @internal As a security precaution, front-end annotations are disabled for now.
	 * Once front-end annotations are allowed, this property could be removed and {@see
	 * WP_Annotation_Utils::is_valid_parent_post_target()} can be updated to use the
	 * {@see WP_Annotation_Utils::$parent_post_targets} property.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 */
	protected static $allow_parent_post_targets = array(
		// '', Front-end annotations disabled for now.
		'admin', // Back-end.
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
	 * Valid annotation substatuses.
	 *
	 * @since [version]
	 *
	 * @var string[]
	 */
	public static $substatuses = array(
		'',        // Default (open).
		'resolve', // Archived as resolved.
		'reject',  // Archived as rejected.
		'archive', // Archived for another reason.
	);

	/**
	 * Registers annotations as a custom post type.
	 *
	 * @since [version]
	 */
	public static function register_post_type() {
		register_post_type( self::$post_type, array(
			'public'                => false,
			'delete_with_user'      => false,
			'hierarchical'          => true,
			'supports'              => array(
				'author',
				'editor',
				'custom-fields',
			),
			'show_in_rest'          => true,
			'rest_base'             => 'annotations',
			'rest_controller_class' => 'WP_REST_Annotations_Controller',

			'map_meta_cap'          => false, // See filter below.
			'capabilities'          => array(
				// Meta-caps.
				'create_post'            => 'create_annotation',
				'read_post'              => 'read_annotation',
				'edit_post'              => 'edit_annotation',
				'delete_post'            => 'delete_annotation',

				// Primitive pseudo-caps.
				'create_posts'           => 'create_annotations',

				// Primitive caps used outside map_meta_cap().
				'edit_posts'             => 'edit_annotations',
				'edit_others_posts'      => 'edit_others_annotations',
				'publish_posts'          => 'publish_annotations',
				'read_private_posts'     => 'read_private_annotations',

				// Primitive caps used inside map_meta_cap().
				'read'                   => 'read_annotations',
				'delete_posts'           => 'delete_annotations',
				'delete_private_posts'   => 'delete_private_annotations',
				'delete_published_posts' => 'delete_published_annotations',
				'delete_others_posts'    => 'delete_others_annotations',
				'edit_private_posts'     => 'edit_private_annotations',
				'edit_published_posts'   => 'edit_published_annotations',
			),
		) );

		add_filter( 'map_meta_cap', array( __CLASS__, 'on_map_meta_cap' ), 10, 4 );
		add_action( 'delete_post', array( __CLASS__, 'on_delete_post' ), 10, 1 );
	}

	/**
	 * Maps annotation meta-caps and pseudo-caps.
	 *
	 * This handles annotation capabilities defined by the post type. Note that an
	 * annotation can target either '' (front-end) or 'admin' (back-end). So these
	 * permission checks must take both targets into careful consideration.
	 *
	 * @since [version]
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability to check/map.
	 * @param int    $user_id User ID (empty if not logged in).
	 * @param array  $args    Arguments to {@see map_meta_cap()}.
	 *
	 * @return array          Array of required capabilities.
	 *
	 * @see WP_Annotation_Utils::register_post_type()
	 */
	public static function on_map_meta_cap( $caps, $cap, $user_id, $args ) {
		switch ( $cap ) {
			/*
			 * Requires $args[0], $args[1] with parent post ID and target.
			 */
			case 'create_annotation': // This is a custom annotation meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0], $args[1] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id            = absint( $user_id );
				$parent_post_id     = absint( $args[0] );
				$parent_post_target = (string) $args[1];
				$parent_post_info   = self::get_parent_post_info( $parent_post_id );

				if ( ! $parent_post_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$parent_post        = $parent_post_info['parent_post'];
				$parent_post_type   = $parent_post_info['parent_post_type'];
				$parent_post_status = $parent_post_info['parent_post_status'];

				/*
				 * Cannot annotate if parent post is in the trash.
				 */
				if ( 'trash' === $parent_post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Check that annotation parent post target is valid.
				 */
				if ( ! self::is_valid_parent_post_target( $parent_post_target ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If creating a front-end annotation on a parent post having a public or private status,
				 * and the user can read & comment on the parent post, then they can create front-end
				 * annotations. Note: Callers should also check if {@see post_password_required()} before
				 * allowing access.
				 */
				if ( '' === $parent_post_target // Front-end target.
						&& ( $parent_post_status->public || $parent_post_status->private )
						&& post_type_supports( $parent_post_type->name, 'comments' ) && comments_open( $parent_post )
						&& ( $user_id || ! get_option( 'comment_registration' ) ) ) {
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_post, $user_id, $parent_post->ID ) );

					if ( $parent_post_status->public && ! get_option( 'comment_registration' ) && array( 'read' ) === $caps ) {
						// If parent post is public, comment registration is off, and parent post only requires 'read' access.
						$caps = array(); // Allow anonymous public access.
					}
					return $caps;
				}

				/*
				 * If creating a back-end annotation in a parent post authored by this user, and the user
				 * can edit a parent post type, then they can create back-end annotations. For example, a
				 * contributor can create back-end annotations in any parent post they authored, even if
				 * they can no longer *edit* the parent post itself; e.g., after it's approved/published.
				 */
				if ( '' !== $parent_post_target && $user_id && (int) $parent_post->post_author === $user_id ) {
					return array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_posts, $user_id ) );
				}

				/*
				 * Otherwise, requires the ability to edit the annotation's parent post.
				 */
				return array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_post, $user_id, $parent_post->ID ) );

			/*
			 * Requires $args[0] with the annotation's post ID.
			 */
			case 'read_annotation': // An annotation's 'read_post' meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id   = absint( $user_id );
				$post_id   = absint( $args[0] );
				$post_info = self::get_post_info( $post_id, true );

				if ( ! $post_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$post               = $post_info['post'];
				$post_type          = $post_info['post_type'];
				$post_status        = $post_info['post_status'];
				$parent_post        = $post_info['parent_post'];
				$parent_post_type   = $post_info['parent_post_type'];
				$parent_post_status = $post_info['parent_post_status'];
				$parent_post_target = $post_info['parent_post_target'];

				/*
				 * Cannot read annotation if parent post is in the trash.
				 */
				if ( 'trash' === $parent_post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Check that annotation parent post target is valid.
				 */
				if ( ! self::is_valid_parent_post_target( $parent_post_target ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If it's an unpublished front-end annotation in a public or private parent post, and the
				 * user can read the parent post and moderate comments, they can read the annotation. Note:
				 * Callers should also check if {@see post_password_required()}.
				 */
				if ( '' === $parent_post_target // Front-end target.
						&& ! $post_status->public && ! $post_status->private
						&& ( $parent_post_status->public || $parent_post_status->private ) ) {
					$caps   = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_post, $user_id, $parent_post->ID ) );
					$caps[] = 'moderate_comments';

					return $caps;
				}

				/*
				 * If it's a front-end annotation having a public or private status; in a public or private
				 * parent post, and the user can read the parent post, then they can read the public and
				 * perhaps private annotation. Note: Callers should also check if {@see
				 * post_password_required()} before allowing access.
				 */
				if ( '' === $parent_post_target // Front-end target.
						&& ( $post_status->public || $post_status->private )
						&& ( $parent_post_status->public || $parent_post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_post, $user_id, $parent_post->ID ) );

					if ( $post_status->private && ( ! $user_id || (int) $post->post_author !== $user_id ) ) {
						// Also requires the ability to read private posts, of the parent post type.
						$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_private_posts, $user_id ) );
					}

					if ( $post_status->public && $parent_post_status->public && array( 'read' ) === $caps ) {
						// If both posts are public and the parent post only requires 'read' access.
						$caps = array(); // Allow anonymous public access.
					}
					return $caps;
				}

				/*
				 * If it's a back-end annotation in a parent post authored by this user, and the user can
				 * edit a parent post type, then they can read the back-end annotation. For example, a
				 * contributor can read back-end annotations in any parent post they authored, even if they
				 * can no longer *edit* the parent post itself; e.g., after it's approved/published.
				 */
				if ( '' !== $parent_post_target && $user_id && (int) $parent_post->post_author === $user_id ) {
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_posts, $user_id ) );

					if ( $post_status->private && ( ! $user_id || (int) $post->post_author !== $user_id ) ) {
						// Also requires the ability to read private posts, of the parent post type.
						$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_private_posts, $user_id ) );
					}
					return $caps;
				}

				/*
				 * Otherwise, requires the ability to edit the annotation's parent post.
				 */
				$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_post, $user_id, $parent_post->ID ) );

				if ( $post_status->private && ( ! $user_id || (int) $post->post_author !== $user_id ) ) {
					// Also requires the ability to read private posts, of the parent post type.
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_private_posts, $user_id ) );
				}
				return $caps;

			/*
			 * Optionally supports $args[0], $args[1] with parent post ID and target.
			 */
			case 'read_annotations': // An annotation's 'read' pseudo-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0], $args[1] ) ) {
					$caps[] = 'edit_posts';
					return $caps;
				}
				$user_id            = absint( $user_id );
				$parent_post_id     = absint( $args[0] );
				$parent_post_target = (string) $args[1];
				$parent_post_info   = self::get_parent_post_info( $parent_post_id );

				if ( ! $parent_post_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$parent_post        = $parent_post_info['parent_post'];
				$parent_post_type   = $parent_post_info['parent_post_type'];
				$parent_post_status = $parent_post_info['parent_post_status'];

				/*
				 * Cannot read annotations if parent post is in the trash.
				 */
				if ( 'trash' === $parent_post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Check that annotation parent post target is valid.
				 */
				if ( ! self::is_valid_parent_post_target( $parent_post_target ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If reading front-end annotations in a public or private parent post, and the user can
				 * read the parent post, then they can read annotations. Note: Callers should also check if
				 * {@see post_password_required()} before allowing access.
				 */
				if ( '' === $parent_post_target // Front-end target.
						&& ( $parent_post_status->public || $parent_post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_post, $user_id, $parent_post->ID ) );

					if ( $parent_post_status->public && array( 'read' ) === $caps ) {
						// If parent post is public and only requires 'read' access.
						$caps = array(); // Allow anonymous public access.
					}
					return $caps;
				}

				/*
				 * If reading back-end annotations in a parent post authored by this user, and the user can
				 * edit a parent post type, then they can read back-end annotations. For example, a
				 * contributor can read back-end annotations in any parent post they authored, even if they
				 * can no longer *edit* the parent post itself; e.g., after it's approved/published.
				 */
				if ( '' !== $parent_post_target && $user_id && (int) $parent_post->post_author === $user_id ) {
					return array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_posts, $user_id ) );
				}

				/*
				 * Otherwise, requires the ability to edit the annotation's parent post.
				 */
				return array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_post, $user_id, $parent_post->ID ) );

			/*
			 * Requires $args[0] with the annotation's post ID.
			 */
			case 'edit_annotation': // An annotation's 'edit_post' meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id   = absint( $user_id );
				$post_id   = absint( $args[0] );
				$post_info = self::get_post_info( $post_id, true );

				if ( ! $post_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$post               = $post_info['post'];
				$post_type          = $post_info['post_type'];
				$post_status        = $post_info['post_status'];
				$parent_post        = $post_info['parent_post'];
				$parent_post_type   = $post_info['parent_post_type'];
				$parent_post_status = $post_info['parent_post_status'];
				$parent_post_target = $post_info['parent_post_target'];

				/*
				 * Cannot edit annotation if parent post is in the trash.
				 */
				if ( 'trash' === $parent_post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Check that annotation parent post target is valid.
				 */
				if ( ! self::is_valid_parent_post_target( $parent_post_target ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If it's a front-end annotation (with any status) in a public or private parent post, and
				 * the user can read the parent post and moderate comments, they can edit annotation. Note:
				 * Callers should also check if {@see post_password_required()}.
				 */
				if ( '' === $parent_post_target // Front-end target.
						&& ( $parent_post_status->public || $parent_post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_post, $user_id, $parent_post->ID ) );

					/*
					 * If the front-end annotation was authored by the specific user, and the user can edit the
					 * parent post, they can edit the annotation.
					 */
					if ( $user_id && (int) $post->post_author === $user_id
							&& user_can( $user_id, $parent_post_type->cap->edit_post, $parent_post->ID ) ) {
						$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_post, $user_id, $parent_post->ID ) );
					} else {
						$caps[] = 'moderate_comments';
					}

					return $caps;
				}

				/*
				 * If it's an annotation authored by this user.
				 */
				if ( $user_id && (int) $post->post_author === $user_id ) {
					/*
					 * If it's a back-end annotation, and it's also in a parent post authored by this user, and
					 * the user can edit a parent post type, then they can edit their own back-end annotation.
					 * For example, a contributor can edit their own back-end annotation in any parent post they
					 * authored, even if they can no longer *edit* the parent post itself; e.g., after it's
					 * approved/published.
					 */
					if ( '' !== $parent_post_target && (int) $parent_post->post_author === $user_id ) {
						return array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_posts, $user_id ) );
					}

					/*
					 * Otherwise, requires the ability to edit the annotation's parent post.
					 */
					return array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_post, $user_id, $parent_post->ID ) );
				}

				/*
				 * Otherwise, requires the ability to edit the annotation's parent post. Also requires an
				 * administrator with the ability to edit others posts, of the parent post type.
				 */
				$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_post, $user_id, $parent_post->ID ) );
				$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_others_posts, $user_id ) );

				if ( 'trash' === $post->post_status ) {
					// When in the trash, test the would-be restoration status.
					$wp_trash_meta_status = get_post_meta( $post->ID, '_wp_trash_meta_status', true );
					$wp_trash_meta_status = $wp_trash_meta_status ? $wp_trash_meta_status : 'draft';

					$post_status = get_post_status_object( $wp_trash_meta_status );
					$post_status = $post_status ? $post_status : get_post_status_object( 'draft' );
				}
				if ( $post_status->public || 'future' === $post_status->name ) {
					// Also requires the ability to edit published posts, of the parent post type.
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_published_posts, $user_id ) );
				}
				if ( $post_status->private ) {
					// Also requires the ability to edit private posts, of the parent post type.
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->edit_private_posts, $user_id ) );
				}
				return $caps;

			/*
			 * Requires $args[0] with the annotation's post ID.
			 */
			case 'delete_annotation': // An annotation's 'delete_post' meta-cap.
				$caps = array_diff( $caps, array( $cap ) );

				if ( ! isset( $args[0] ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$user_id   = absint( $user_id );
				$post_id   = absint( $args[0] );
				$post_info = self::get_post_info( $post_id, true );

				if ( ! $post_info ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}
				$post               = $post_info['post'];
				$post_type          = $post_info['post_type'];
				$post_status        = $post_info['post_status'];
				$parent_post        = $post_info['parent_post'];
				$parent_post_type   = $post_info['parent_post_type'];
				$parent_post_status = $post_info['parent_post_status'];
				$parent_post_target = $post_info['parent_post_target'];

				/*
				 * Cannot delete annotation if parent post is in the trash.
				 */
				if ( 'trash' === $parent_post_status->name ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * Check that annotation parent post target is valid.
				 */
				if ( ! self::is_valid_parent_post_target( $parent_post_target ) ) {
					$caps[] = 'do_not_allow';
					return $caps;
				}

				/*
				 * If it's a front-end annotation (with any status) in a public or private parent post, and
				 * the user can read the parent post and moderate comments, they can delete annotation.
				 * Note: Callers should also check if {@see post_password_required()}.
				 */
				if ( '' === $parent_post_target // Front-end target.
						&& ( $parent_post_status->public || $parent_post_status->private ) ) {
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->read_post, $user_id, $parent_post->ID ) );

					/*
					 * If the front-end annotation was authored by the specific user, and the user can delete the
					 * parent post, they can delete the annotation.
					 */
					if ( $user_id && (int) $post->post_author === $user_id
							&& user_can( $user_id, $parent_post_type->cap->delete_post, $parent_post->ID ) ) {
						$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->delete_post, $user_id, $parent_post->ID ) );
					} else {
						$caps[] = 'moderate_comments';
					}

					return $caps;
				}

				/*
				 * If it's an annotation authored by this user.
				 */
				if ( $user_id && (int) $post->post_author === $user_id ) {
					/*
					 * If it's a back-end annotation, and it's also in a parent post authored by this user, and
					 * the user can delete a parent post type, then they can delete their own back-end
					 * annotation. For example, a contributor can delete their own back-end annotation in any
					 * parent post they authored, even if they can no longer *delete* the parent post itself;
					 * e.g., after it's approved/published.
					 */
					if ( '' !== $parent_post_target && (int) $parent_post->post_author === $user_id ) {
						return array_merge( $caps, map_meta_cap( $parent_post_type->cap->delete_posts, $user_id ) );
					}

					/*
					 * Otherwise, requires the ability to delete the annotation's parent post.
					 */
					return array_merge( $caps, map_meta_cap( $parent_post_type->cap->delete_post, $user_id, $parent_post->ID ) );
				}

				/*
				 * Otherwise, requires the ability to delete the annotation's parent post. Also requires an
				 * administrator with the ability to delete others posts, of the parent post type.
				 */
				$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->delete_post, $user_id, $parent_post->ID ) );
				$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->delete_others_posts, $user_id ) );

				if ( 'trash' === $post->post_status ) {
					// When in the trash, test the would-be restoration status.
					$wp_trash_meta_status = get_post_meta( $post->ID, '_wp_trash_meta_status', true );
					$wp_trash_meta_status = $wp_trash_meta_status ? $wp_trash_meta_status : 'draft';

					$post_status = get_post_status_object( $wp_trash_meta_status );
					$post_status = $post_status ? $post_status : get_post_status_object( 'draft' );
				}
				if ( $post_status->public || 'future' === $post_status->name ) {
					// Also requires the ability to delete published posts, of the parent post type.
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->delete_published_posts, $user_id ) );
				}
				if ( $post_status->private ) {
					// Also requires the ability to delete private posts, of the parent post type.
					$caps = array_merge( $caps, map_meta_cap( $parent_post_type->cap->delete_private_posts, $user_id ) );
				}
				return $caps;

			/*
			 * All other pseudo-caps are handled dynamically.
			 * These are simply mapped to the equivalent *_posts cap.
			 * Optionally supports $args[0] with an annotation parent post target.
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
					$parent_post_target = (string) $args[0];

					/*
					 * Check that annotation parent post target is valid.
					 */
					if ( ! self::is_valid_parent_post_target( $parent_post_target ) ) {
						$caps[] = 'do_not_allow';
						return $caps;
					}

					/*
					 * If checking front-end annotations, and the user can moderate comments, they can do
					 * anything with front-end annotations; e.g., create, read, edit, delete.
					 */
					if ( '' === $parent_post_target ) {
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
	 * Gets an array of annotation (and parent post) info.
	 *
	 * @since [version]
	 *
	 * @param WP_Post|int $post             Post (i.e., annotation) object or ID.
	 * @param bool        $resolve_revision Resolve revision? Default false. If true,
	 *                                      returns the revision's parent info.
	 *
	 * @return array                        Post (i.e., annotation) info, including
	 *                                      parent info. Empty array on failure.
	 */
	public static function get_post_info( $post, $resolve_revision = false ) {
		/*
		 * Collect post info.
		 */

		if ( ! $post ) {
			return array();
		}

		$post = get_post( $post );

		if ( ! $post ) {
			return array();
		}

		if ( 'revision' == $post->post_type && $resolve_revision ) {
			if ( ! $post->post_parent ) {
				return array();
			}

			$post = get_post( $post->post_parent );

			if ( ! $post ) {
				return array();
			}
		}

		if ( $post->post_type !== self::$post_type ) {
			return array(); // Not an annotation.
		}

		$post_type   = get_post_type_object( $post->post_type );
		$post_status = get_post_status_object( get_post_status( $post ) );

		if ( ! $post_type || ! $post_status ) {
			return array();
		}

		/*
		 * Collect parent post info.
		 */

		$parent_post_id   = absint( get_post_meta( $post->ID, '_parent_post', true ) );
		$parent_post_info = self::get_parent_post_info( $parent_post_id );

		if ( ! $parent_post_info ) {
			return array();
		}

		$parent_post        = $parent_post_info['parent_post'];
		$parent_post_type   = $parent_post_info['parent_post_type'];
		$parent_post_status = $parent_post_info['parent_post_status'];
		$parent_post_target = (string) get_post_meta( $post->ID, '_parent_post_target', true );

		/*
		 * Return all info.
		 */

		return compact(
			'post',
			'post_type',
			'post_status',
			'parent_post',
			'parent_post_type',
			'parent_post_status',
			'parent_post_target'
		);
	}

	/**
	 * Gets an array of parent post (non-annotation) info.
	 *
	 * @since [version]
	 *
	 * @param WP_Post|int $parent_post Parent post (non-annotation) object or ID.
	 *
	 * @return array                   Parent post info. Empty array on failure.
	 */
	public static function get_parent_post_info( $parent_post ) {
		if ( ! $parent_post ) {
			return array();
		}

		$parent_post = get_post( $parent_post );

		if ( ! $parent_post ) {
			return array();
		}

		if ( 'revision' === $parent_post->post_type ) {
			return array(); // Must not be a revision.
		}

		if ( $parent_post->post_type === self::$post_type ) {
			return array(); // Must not be an annotation.
		}

		$parent_post_type   = get_post_type_object( $parent_post->post_type );
		$parent_post_status = get_post_status_object( get_post_status( $parent_post ) );

		if ( ! $parent_post_type || ! $parent_post_status ) {
			return array();
		}

		return compact(
			'parent_post',
			'parent_post_type',
			'parent_post_status'
		);
	}

	/**
	 * Delete a post's annotations whenever its permanently deleted from the database.
	 *
	 * @since [version]
	 *
	 * @param int $post_id Post ID being deleted.
	 */
	public static function on_delete_post( $post_id ) {
		if ( ! $post_id ) {
			return;
		}

		$post = get_post( $post_id );

		if ( ! $post || $post->post_type === self::$post_type ) {
			return; // Only dealing with non-annotation types.
		}

		$query          = new WP_Query();
		$annotation_ids = $query->query( array(
			'fields'              => 'ids',
			'post_type'           => self::$post_type,
			'post_status'         => array_keys( get_post_stati() ),
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
			'suppress_filters'    => true,
			'posts_per_page'      => -1,
			'meta_query'          => array(
				'key'   => '_parent_post',
				'value' => $post->ID,
			),
		) );

		foreach ( $annotation_ids as $annotation_id ) {
			wp_delete_post( $annotation_id, true ); // Force deletion.
		}
	}

	/**
	 * Registers additional REST API fields.
	 *
	 * @since [version]
	 */
	public static function register_additional_rest_fields() {
		register_rest_field( self::$post_type, 'parent_post', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'required'    => true,
				'type'        => 'integer',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'Parent post ID.', 'gutenberg' ),
			),
		) );

		register_rest_field( self::$post_type, 'parent_post_target', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'enum'        => self::$parent_post_targets,
				'description' => __( 'Parent post target.', 'gutenberg' ),
				'default'     => '',
			),
		) );

		register_rest_field( self::$post_type, 'parent_post_password', array(
			'schema' => array(
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'Parent post password.', 'gutenberg' ),
			),
		) );

		register_rest_field( self::$post_type, 'via', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'W3C annotation client identifier.', 'gutenberg' ),
				'default'     => '',
			),
		) );

		register_rest_field( self::$post_type, 'author_meta', array(
			'get_callback' => array( __CLASS__, 'on_get_additional_rest_field' ),
			'schema'       => array(
				'readonly'    => true,
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'Author metadata.', 'gutenberg' ),

				'properties'  => array(
					'display_name' => array(
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'description' => __( 'Display name.', 'gutenberg' ),
					),
					'image_url'    => array(
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'description' => __( 'Square avatar image URL.', 'gutenberg' ),
					),
				),
			),
		) );

		register_rest_field( self::$post_type, 'creator', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'description' => sprintf(
					// translators: %s is a regular expression pattern to clarify data requirements.
					__( 'Creator (plugin, service, other). Requires a non-numeric slug: %s', 'gutenberg' ),
					'^[a-z][a-z0-9_-]*[a-z0-9]$'
				),
			),
		) );

		register_rest_field( self::$post_type, 'creator_meta', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'Creator metadata.', 'gutenberg' ),

				'properties'  => array(
					'display_name' => array(
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'description' => __( 'Display name.', 'gutenberg' ),
					),
					'image_url'    => array(
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'description' => __( 'Square avatar image URL.', 'gutenberg' ),
					),
				),
			),
		) );

		register_rest_field( self::$post_type, 'selector', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'W3C annotation selector.', 'gutenberg' ),

				'properties'  => array(
					'type'                 => array(
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'enum'        => self::$selectors,
						'description' => __( 'Type of selector.', 'gutenberg' ),
					),
					'additionalProperties' => true,
				),
				'default'     => array(),
			),
		) );

		register_rest_field( self::$post_type, 'substatus', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'enum'        => self::$substatuses,
				'description' => __( 'Current substatus.', 'gutenberg' ),
				'default'     => '',
			),
		) );

		register_rest_field( self::$post_type, 'last_substatus_time', array(
			'get_callback' => array( __CLASS__, 'on_get_additional_rest_field' ),
			'schema'       => array(
				'readonly'    => true,
				'type'        => 'integer',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'Last substatus change (GMT/UTC timestamp).', 'gutenberg' ),
			),
		) );

		register_rest_field( self::$post_type, 'substatus_history', array(
			'get_callback' => array( __CLASS__, 'on_get_additional_rest_field' ),
			'schema'       => array(
				'readonly'    => true,
				'type'        => 'array',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'Substatus history.', 'gutenberg' ),

				'items'       => array(
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'description' => __( 'History entry.', 'gutenberg' ),

					'properties'  => array(
						'identity'      => array(
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
							'description' => __( 'Identity (user or creator).', 'gutenberg' ),
						),
						'identity_meta' => array(
							'type'        => 'object',
							'context'     => array( 'view', 'edit' ),
							'description' => __( 'Identity metadata.', 'gutenberg' ),

							'properties'  => array(
								'display_name' => array(
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
									'description' => __( 'Display name.', 'gutenberg' ),
								),
								'image_url'    => array(
									'type'        => 'string',
									'context'     => array( 'view', 'edit' ),
									'description' => __( 'Square avatar image URL.', 'gutenberg' ),
								),
							),
						),
						'time'          => array(
							'type'        => 'integer',
							'context'     => array( 'view', 'edit' ),
							'description' => __( 'When substatus changed (GMT/UTC timestamp).', 'gutenberg' ),
						),
						'old'           => array(
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
							'enum'        => self::$substatuses,
							'description' => __( 'Old substatus.', 'gutenberg' ),
						),
						'new'           => array(
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
							'enum'        => self::$substatuses,
							'description' => __( 'New substatus.', 'gutenberg' ),
						),
					),
				),
			),
		) );
	}

	/**
	 * Add additional REST API filters for annotations.
	 *
	 * @since [version]
	 */
	public static function add_rest_related_filters() {
		add_filter( 'rest_' . self::$post_type . '_collection_params', array( __CLASS__, 'on_rest_collection_params' ) );
		add_filter( 'rest_' . self::$post_type . '_query', array( __CLASS__, 'on_rest_collection_query' ), 10, 2 );

		// Note: Akisment could use this same filter to spam-check front-end annotations.
		add_filter( 'rest_pre_insert_' . self::$post_type, array( __CLASS__, 'on_rest_pre_insert' ), 10, 2 );
	}

	/**
	 * Adds additional REST API collection parameters.
	 *
	 * @since [version]
	 *
	 * @param  array $params JSON Schema-formatted collection parameters.
	 *
	 * @return array         Filtered JSON Schema-formatted collection parameters.
	 *
	 * @see WP_Annotation_Utils::add_rest_related_filters()
	 */
	public static function on_rest_collection_params( $params ) {
		$params['hierarchical'] = array(
			'type'        => 'string',
			'description' => __( 'Results in hierarchical format?', 'gutenberg' ),
			'enum'        => array( '', 'flat', 'threaded' ),
		);

		$params['parent_post'] = array(
			'required'    => true,
			'type'        => 'array',
			'description' => __( 'Limit result set to those with one or more parent post IDs.', 'gutenberg' ),
			'items'       => array(
				'type' => 'integer',
			),
		);

		$params['parent_post_target'] = array(
			'type'        => 'array',
			'description' => __( 'Limit result set to those with a specific parent post target.', 'gutenberg' ),
			'items'       => array(
				'type' => 'string',
				'enum' => self::$parent_post_targets,
			),
			'default'     => array( '' ),
		);

		$params['parent_post_password'] = array(
			'type'        => 'array',
			'description' => __( 'Password(s) for parent post ID in request.', 'gutenberg' ),
			'items'       => array(
				'type' => 'string',
			),
		);

		$params['via'] = array(
			'type'              => 'array',
			'description'       => __( 'Limit result set to those generated by one or more clients.', 'gutenberg' ),
			'items'             => array(
				'type' => 'string',
			),
			'validate_callback' => array( __CLASS__, 'validate_via_collection_param' ),
		);

		$params['creator'] = array(
			'type'              => 'array',
			'description'       => __( 'Limit result set to those by one or more creators.', 'gutenberg' ),
			'items'             => array(
				'type' => 'string',
			),
			'validate_callback' => array( __CLASS__, 'validate_creator_collection_param' ),
		);

		$params['substatus'] = array(
			'type'        => 'array',
			'description' => __( 'Limit result set to those assigned one or more substatuses.', 'gutenberg' ),
			'items'       => array(
				'type' => 'string',
				'enum' => self::$substatuses,
			),
			'default'     => array( '' ),
		);

		return $params;
	}

	/**
	 * Validates the 'via' collection parameter.
	 *
	 * @since [version]
	 *
	 * @param  string|array $vias W3C annotation client identifier(s).
	 *
	 * @return WP_Error|bool      True if valid, {@see WP_Error} otherwise.
	 */
	public function validate_via_collection_param( $vias ) {
		if ( ! is_array( $vias ) ) {
			$vias = preg_split( '/[\s,]+/', (string) $vias );
		}

		if ( ! wp_is_numeric_array( $vias ) ) {
			return new WP_Error( 'rest_annotation_invalid_array_param_via', __( 'Invalid client identifier(s).', 'gutenberg' ) );
		}

		foreach ( $vias as $via ) {
			if ( ! self::is_valid_client( $via ) ) {
				return new WP_Error( 'rest_annotation_invalid_param_via', __( 'Invalid client identifier.', 'gutenberg' ) );
			}
		}

		return true;
	}

	/**
	 * Validates the 'creator' collection parameter.
	 *
	 * @since [version]
	 *
	 * @param  string|array $creators Annotation creator(s).
	 *
	 * @return WP_Error|bool          True if valid, {@see WP_Error} otherwise.
	 */
	public function validate_creator_collection_param( $creators ) {
		if ( ! is_array( $creators ) ) {
			$creators = preg_split( '/[\s,]+/', (string) $creators );
		}

		if ( ! wp_is_numeric_array( $creators ) ) {
			return new WP_Error( 'rest_annotation_invalid_array_param_creator', __( 'Invalid creator(s).', 'gutenberg' ) );
		}

		foreach ( $creators as $creator ) {
			if ( ! self::is_valid_creator( $creator ) ) {
				return new WP_Error( 'rest_annotation_invalid_param_creator', __( 'Invalid creator.', 'gutenberg' ) );
			}
		}

		return true;
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
	 * @see WP_Annotation_Utils::on_rest_collection_params()
	 */
	public static function on_rest_collection_query( $query_vars, $request ) {
		/*
		 * A hierarchical request sets post_parent to 0 by default.
		 */
		if ( $request['hierarchical'] && ! $request['parent'] ) {
			$query_vars['post_parent'] = 0;
		}

		/*
		 * Build meta queries.
		 */
		$meta_queries = array();

		$parent_post_ids = $request['parent_post'];
		$parent_post_ids = $parent_post_ids ? (array) $parent_post_ids : array();
		$parent_post_ids = array_map( 'absint', $parent_post_ids );

		if ( $parent_post_ids ) {
			$meta_queries[] = array(
				'key'     => '_parent_post',
				'value'   => $parent_post_ids,
				'compare' => 'IN',
			);
		}

		$parent_post_targets = $request['parent_post_target'];
		$parent_post_targets = isset( $parent_post_targets ) ? (array) $parent_post_targets : array();
		$parent_post_targets = array_map( 'strval', $parent_post_targets );

		if ( $parent_post_targets ) {
			$meta_queries[] = array(
				'key'     => '_parent_post_target',
				'value'   => $parent_post_targets,
				'compare' => 'IN',
			);
		}

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

		$creators = $request['creator'];
		$creators = $creators ? (array) $creators : array();
		$creators = array_map( 'strval', $creators );

		if ( $creators ) {
			$meta_queries[] = array(
				'key'     => '_creator',
				'value'   => $creators,
				'compare' => 'IN',
			);
		}

		$substatuses = $request['substatus'];
		$substatuses = $substatuses ? (array) $substatuses : array();
		$substatuses = array_map( 'strval', $substatuses );

		if ( $substatuses ) {
			$meta_queries[] = array(
				'key'     => '_substatus',
				'value'   => $substatuses,
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
	 * Gets an additional REST API field value.
	 *
	 * @since [version]
	 *
	 * @param  array|WP_Post   $post    Post (i.e., an annotation).
	 * @param  string          $field   Name of the field to get.
	 * @param  WP_Rest_Request $request Full REST API request details.
	 *
	 * @return mixed|null               Current value, null otherwise.
	 *
	 * @see WP_Annotation_Utils::register_additional_rest_fields()
	 */
	public static function on_get_additional_rest_field( $post, $field, $request ) {
		/*
		 * There is some inconsistency (array|WP_Post) in the REST API hooks. So here we are
		 * double-checking the $post data type before we begin.
		 */
		if ( is_array( $post ) ) {
			if ( ! empty( $post['id'] ) ) {
				$post = get_post( $post['id'] );
			} elseif ( ! empty( $post['ID'] ) ) {
				$post = get_post( $post['ID'] );
			}
		}

		$value = get_post_meta( $post->ID, '_' . $field, true );

		switch ( $field ) {
			case 'parent_post':
				return is_numeric( $value ) ? absint( $value ) : 0;

			case 'parent_post_target':
				return is_string( $value ) ? $value : '';

			case 'via':
				return is_string( $value ) ? $value : '';

			case 'author_meta':
				$defaults = array(
					'display_name' => '',
					'image_url'    => '',
				);
				$value    = is_array( $value ) ? $value : array();
				return array_merge( $defaults, $value );

			case 'creator':
				return is_string( $value ) ? $value : '';

			case 'creator_meta':
				$defaults = array(
					'display_name' => '',
					'image_url'    => '',
				);
				$value    = is_array( $value ) ? $value : array();
				return array_merge( $defaults, $value );

			case 'selector':
				return is_array( $value ) ? $value : array();

			case 'substatus':
				return is_string( $value ) ? $value : '';

			case 'last_substatus_time':
				return is_numeric( $value ) ? absint( $value ) : 0;

			case 'substatus_history':
				return is_array( $value ) ? $value : array();
		}
	}

	/**
	 * Updates an additional REST API field value.
	 *
	 * @since [version]
	 *
	 * @param  string          $value   New field value.
	 * @param  array|WP_Post   $post    Post (i.e., an annotation).
	 * @param  string          $field   Name of the field to update.
	 * @param  WP_Rest_Request $request Full REST API request details.
	 *
	 * @return WP_Error|null            {@see WP_Error} on failure, null otherwise.
	 *
	 * @see WP_Annotation_Utils::register_additional_rest_fields()
	 */
	public static function on_update_additional_rest_field( $value, $post, $field, $request ) {
		/*
		 * There is some inconsistency (array|WP_Post) in the REST API hooks. So here we are
		 * double-checking the $post data type before we begin.
		 */
		if ( is_array( $post ) ) {
			if ( ! empty( $post['id'] ) ) {
				$post = get_post( $post['id'] );
			} elseif ( ! empty( $post['ID'] ) ) {
				$post = get_post( $post['ID'] );
			}
		}

		switch ( $field ) {
			case 'parent_post':
				$value = self::validate_rest_field_parent_post_on_update( $value, $post, $request );

				if ( is_wp_error( $value ) ) {
					return $value;
				}
				update_post_meta( $post->ID, '_' . $field, $value );

				break;

			case 'parent_post_target':
				$value = self::validate_rest_field_parent_post_target_on_update( $value, $post, $request );

				if ( is_wp_error( $value ) ) {
					return $value;
				}
				update_post_meta( $post->ID, '_' . $field, $value );

				break;

			case 'via':
				$value = self::validate_rest_field_via_on_update( $value, $post, $request );

				if ( is_wp_error( $value ) ) {
					return $value;
				}
				update_post_meta( $post->ID, '_' . $field, $value );

				break;

			case 'creator':
				$value = self::validate_rest_field_creator_on_update( $value, $request['creator_meta'], $post, $request );

				if ( is_wp_error( $value ) ) {
					return $value;
				}
				update_post_meta( $post->ID, '_' . $field, $value['id'] );

				break;

			case 'creator_meta':
				$value = self::validate_rest_field_creator_on_update( $request['creator'], $value, $post, $request );

				if ( is_wp_error( $value ) ) {
					return $value;
				}
				update_post_meta( $post->ID, '_' . $field, $value['meta'] );

				break;

			case 'selector':
				$value = self::validate_rest_field_selector_on_update( $value, $post, $request );

				if ( is_wp_error( $value ) ) {
					return $value;
				}
				update_post_meta( $post->ID, '_' . $field, $value );

				break;

			case 'substatus':
				$value     = self::validate_rest_field_substatus_on_update( $value, $post, $request );
				$old_value = (string) get_post_meta( $post->ID, '_' . $field, true );

				if ( is_wp_error( $value ) ) {
					return $value;
				}
				update_post_meta( $post->ID, '_' . $field, $value );
				self::maybe_update_rest_field_substatus_history( $value, $old_value, $post, $request );

				break;

			default:
				return self::rest_field_unexpected_update_error( $field );
		}
	}

	/**
	 * Filters an annotation before REST API create or update.
	 *
	 * @since [version]
	 *
	 * @param  stdClass        $prepared Prepared post (i.e., an annotation).
	 * @param  WP_Rest_Request $request  Full REST API request details.
	 *
	 * @return stdClass|WP_Error         Prepared post, {@see WP_Error} otherwise.
	 *
	 * @see WP_Annotation_Utils::add_rest_related_filters()
	 */
	public static function on_rest_pre_insert( $prepared, $request ) {
		if ( $request['id'] ) { // Updating.
			if ( isset( $prepared->post_content ) && ! $prepared->post_content ) {
				return new WP_Error( 'rest_cannot_update_annotation_content_empty', __( 'Content cannot be empty.', 'gutenberg' ), array(
					'status' => 400,
				) );
			}
		} elseif ( empty( $prepared->post_content ) ) {
			return new WP_Error( 'rest_cannot_create_annotation_content_empty', __( 'Content cannot be empty.', 'gutenberg' ), array(
				'status' => 400,
			) );
		}

		return $prepared;
	}

	/**
	 * Validates a parent post ID on REST API update.
	 *
	 * @since [version]
	 *
	 * @param  string|int      $parent_post_id Parent post ID.
	 * @param  WP_Post         $post           Post (i.e., an annotation).
	 * @param  WP_Rest_Request $request        Full REST API request details.
	 *
	 * @return int|WP_Error                    Parent post ID, {@see WP_Error} otherwise.
	 *
	 * @see WP_Annotation_Utils::on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_parent_post_on_update( $parent_post_id, $post, $request ) {
		$error = self::rest_field_validation_update_error( 'parent_post' );

		if ( ! $parent_post_id ) {
			return $error;
		} elseif ( ! is_numeric( $parent_post_id ) ) {
			return $error;
		}

		$parent_post_id = absint( $parent_post_id );
		$parent_post    = get_post( $parent_post_id );

		if ( ! $parent_post || $parent_post->post_type === self::$post_type ) {
			return $error; // Must be a child of a non-annotation post type.
		}

		return $parent_post_id;
	}

	/**
	 * Validates parent post target on REST API update.
	 *
	 * @since [version]
	 *
	 * @param  string          $parent_post_target Parent post target.
	 * @param  WP_Post         $post               Post (i.e., an annotation).
	 * @param  WP_Rest_Request $request            Full REST API request details.
	 *
	 * @return string|WP_Error                     Parent post target,
	 *                                             {@see WP_Error} otherwise.
	 *
	 * @see WP_Annotation_Utils::on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_parent_post_target_on_update( $parent_post_target, $post, $request ) {
		if ( ! self::is_valid_parent_post_target( $parent_post_target ) ) {
			return self::rest_field_validation_update_error( 'parent_post_target' );
		}

		return $parent_post_target;
	}

	/**
	 * Validates 'via' (W3C annotation client identifier) on REST API update.
	 *
	 * @since [version]
	 *
	 * @param  string          $via     Annotation client.
	 * @param  WP_Post         $post    Post (i.e., an annotation).
	 * @param  WP_Rest_Request $request Full REST API request details.
	 *
	 * @return string|WP_Error          Via (client), {@see WP_Error} otherwise.
	 *
	 * @see WP_Annotation_Utils::on_update_additional_rest_field()
	 *
	 * @link https://www.w3.org/TR/annotation-model/#rendering-software
	 */
	protected static function validate_rest_field_via_on_update( $via, $post, $request ) {
		if ( ! self::is_valid_client( $via ) ) {
			return self::rest_field_validation_update_error( 'via' );
		}

		return $via;
	}

	/**
	 * Validates a 'creator' on REST API update (ID & meta together).
	 *
	 * @since [version]
	 *
	 * @param  string          $id        Arbitrary creator ID.
	 * @param  array           $meta      Creator meta values.
	 * @param  WP_Post         $post      Post (i.e., an annotation).
	 * @param  WP_Rest_Request $request   Full REST API request details.
	 *
	 * @return array|WP_Error             Associative array [id, meta],
	 *                                    {@see WP_Error} otherwise.
	 *
	 * @see WP_Annotation_Utils::on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_creator_on_update( $id, $meta, $post, $request ) {
		$error = self::rest_field_validation_update_error( array( 'creator', 'creator_meta' ) );

		if ( '' === $id ) { // Empty is OK.
			$meta = array();
			return compact( 'id', 'meta' );
		}

		if ( ! $id || ! self::is_valid_creator( $id ) ) {
			return $error;
		} elseif ( ! $meta || ! is_array( $meta ) ) {
			return $error;
		}

		$default_meta = array(
			'display_name' => '',
			'image_url'    => '',
		);
		$raw_meta     = $meta; // Original input meta.

		$existing_meta = get_post_meta( $post->ID, '_creator_meta', true );
		$existing_meta = is_array( $existing_meta ) ? $existing_meta : array();

		$meta = array_merge( $default_meta, $existing_meta, $meta );
		$meta = array_intersect_key( $meta, $default_meta );

		/* Check display name. */

		if ( ! is_string( $meta['display_name'] ) ) {
			return $error;
		}
		$meta['display_name'] = sanitize_text_field( $meta['display_name'] );
		$meta['display_name'] = mb_substr( $meta['display_name'], 0, 250 );

		if ( ! $meta['display_name'] ) {
			return $error;
		} elseif ( $meta['display_name'] !== $raw_meta['display_name'] ) {
			return $error;
		}

		/* Check image URL. */

		if ( ! is_string( $meta['image_url'] ) ) {
			return $error;
		} elseif ( 2000 < strlen( $meta['image_url'] ) ) {
			return $error;
		}
		$image_path     = (string) wp_parse_url( $meta['image_url'], PHP_URL_PATH );
		$image_filetype = wp_check_filetype( $image_path );

		if ( ! in_array( $image_filetype['ext'], array( 'jpg', 'jpeg', 'png', 'gif', 'ico' ), true ) ) {
			return $error;
		}

		return compact( 'id', 'meta' );
	}

	/**
	 * Validates a W3C annotation selector on REST API update.
	 *
	 * @since [version]
	 *
	 * @param  array           $selector Selector type/data.
	 * @param  WP_Post         $post     Post (i.e., an annotation).
	 * @param  WP_Rest_Request $request  Full REST API request details.
	 *
	 * @return array|WP_Error            Selector array, {@see WP_Error} otherwise.
	 *
	 * @see WP_Annotation_Utils::on_update_additional_rest_field()
	 *
	 * @link https://www.w3.org/TR/annotation-model/#selectors
	 */
	protected static function validate_rest_field_selector_on_update( $selector, $post, $request ) {
		if ( ! $selector ) {
			return array(); // Empty is OK.
		}

		if ( ! self::is_valid_selector( $selector ) ) {
			return self::rest_field_validation_update_error( 'selector' );
		}

		return $selector;
	}

	/**
	 * Validates a substatus on REST API update.
	 *
	 * @since [version]
	 *
	 * @param  string          $substatus Substatus.
	 * @param  WP_Post         $post      Post (i.e., an annotation).
	 * @param  WP_Rest_Request $request   Full REST API request details.
	 *
	 * @return string|WP_Error            Substatus, {@see WP_Error} otherwise.
	 *
	 * @see WP_Annotation_Utils::on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_substatus_on_update( $substatus, $post, $request ) {
		if ( ! in_array( $substatus, self::$substatuses, true ) ) {
			return self::rest_field_validation_update_error( 'substatus' );
		}

		return $substatus;
	}

	/**
	 * Maybe update substatus history on REST API update.
	 *
	 * @since [version]
	 *
	 * @param  string          $new     New substatus.
	 * @param  string          $old     Old substatus.
	 * @param  WP_Post         $post    Post (i.e., an annotation).
	 * @param  WP_Rest_Request $request Full REST API request details.
	 *
	 * @see WP_Annotation_Utils::on_update_additional_rest_field()
	 */
	protected static function maybe_update_rest_field_substatus_history( $new, $old, $post, $request ) {
		if ( $new === $old ) {
			return; // No change.
		}

		$current_time      = time();
		$user              = wp_get_current_user();
		$new_history_entry = array(); // Initialize.

		$history = get_post_meta( $post->ID, '_substatus_history', true );
		$history = is_array( $history ) ? $history : array();

		$creator = self::validate_rest_field_creator_on_update(
			$request['creator'], $request['creator_meta'], $post, $request
		);

		if ( ! is_wp_error( $creator ) ) {
			$new_history_entry = array(
				'identity'      => $creator['id'],
				'identity_meta' => array(
					'display_name' => $creator['meta']['display_name'],
					'image_url'    => $creator['meta']['image_url'],
				),
				'time'          => $current_time,
				'old'           => $old,
				'new'           => $new,
			);
		} elseif ( $user->exists() ) {
			$new_history_entry = array(
				'identity'      => (string) $user->ID,
				'identity_meta' => array(
					'display_name' => $user->display_name,
					'image_url'    => get_avatar_url( $user->ID ),
				),
				'time'          => $current_time,
				'old'           => $old,
				'new'           => $new,
			);
		}

		if ( $new_history_entry ) {
			/**
			 * Allows annotation substatus history length to be increased or decreased.
			 *
			 * @since [version]
			 *
			 * @param int $length Maximum substatus changes to remember in each annotation. By
			 *                    default, substatus history will remember the last 25 changes.
			 */
			$history_length = apply_filters( 'annotation_substatus_history_length', 25 );

			$history[] = $new_history_entry;
			$history   = array_slice( $history, -$history_length );

			update_post_meta( $post->ID, '_last_substatus_time', $current_time );
			update_post_meta( $post->ID, '_substatus_history', $history );
		}
	}

	/**
	 * Validates a parent post target.
	 *
	 * @since [version]
	 *
	 * @param  string $target Parent post target.
	 *
	 * @return bool           True if parent post target is valid.
	 */
	protected static function is_valid_parent_post_target( $target ) {
		/**
		 * Filters parent post targets allowed for annotations.
		 *
		 * @since [version]
		 *
		 * @param array Parent post targets allowed for annotations.
		 */
		$allow_parent_post_targets = apply_filters( 'annotation_allow_parent_post_targets', self::$allow_parent_post_targets );

		return in_array( $target, $allow_parent_post_targets, true );
	}

	/**
	 * Validates a annotation creator's identifier.
	 *
	 * @since [version]
	 *
	 * @param  string $creator The annotation creator to check.
	 *
	 * @return bool            True if creator is valid.
	 */
	protected static function is_valid_creator( $creator ) {
		if ( '' === $creator ) {
			return true; // Empty is OK.
		}

		if ( ! is_string( $creator ) ) {
			return false;
		}
		$raw_creator = $creator;
		$creator     = sanitize_key( $creator );
		$creator     = substr( trim( $creator, '_-' ), 0, 250 );

		if ( ! $creator || $creator !== $raw_creator ) {
			return false;
		} elseif ( is_numeric( $creator ) ) {
			return false;
		}

		return true;
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
	protected static function is_valid_client( $client ) {
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
	protected static function is_valid_selector( $selector, $recursive = false ) {
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

	/**
	 * Returns a {@see WP_Error} for REST API field update validation errors.
	 *
	 * @since [version]
	 *
	 * @param  string|string[] $field The problematic field name(s).
	 *
	 * @return WP_Error               {@see WP_Error} object instance.
	 */
	protected static function rest_field_validation_update_error( $field ) {
		if ( is_array( $field ) ) {
			$field = implode( ', ', array_map( 'strval', $field ) );
		}
		$field = (string) $field;

		// translators: %s is a comma-delimited list of REST API field names associated with failure.
		$error = __( 'Validation error. Unexpected: %s.', 'gutenberg' );
		return new WP_Error( 'rest_annotation_field_validation_update_failure', sprintf( $error, $field ), array( 'status' => 400 ) );
	}

	/**
	 * Returns a {@see WP_Error} for unexpected REST API field update errors.
	 *
	 * @since [version]
	 *
	 * @param  string $field The problematic field name.
	 *
	 * @return WP_Error      {@see WP_Error} object instance.
	 */
	protected static function rest_field_unexpected_update_error( $field ) {
		if ( is_array( $field ) ) {
			$field = implode( ', ', array_map( 'strval', $field ) );
		}
		$field = (string) $field;

		// translators: %s is a comma-delimited list of REST API field names associated with failure.
		$error = __( 'Unexpected error. Failed to update: %s.', 'gutenberg' );
		return new WP_Error( 'rest_annotation_field_unexpected_update_failure', sprintf( $error, $field ), array( 'status' => 400 ) );
	}
}
