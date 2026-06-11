<?php
/**
 * Dynamic registrar for the default `core/{post_type}-fields` field collections.
 *
 * Registers a field collection for every REST-enabled post type that does not
 * already have one, mirroring the client-side fallback in
 * `packages/editor/src/dataviews/store/private-actions.ts` — same conditions,
 * same field order — so the UI is unchanged when the source flips from the
 * fallback to a server-registered collection.
 *
 * The non-serializable extensions (getValue, render, Edit…) shared by these
 * collections live in the collocated `extensions.ts`, exposed as the
 * `@wordpress/fields/postType-default` script module. The client merge ignores
 * extension entries for fields a collection does not include, so the one
 * module serves all post types.
 *
 * This file is copied to `build/scripts/fields/collections/postType-default/fields.php`
 * by the `wpCopyFiles` config in the package's package.json, and required on
 * `init` by `gutenberg_register_core_field_collections()`. Because the loader
 * requires the collection files in alphabetical glob order, this file is
 * loaded before most hand-written collections (`postType-default` sorts before
 * `postType-page`…), so it must not register anything at require time.
 * Instead, it hooks the registration loop on `init` at priority 100 — after
 * the hand-written core collections (registered while the loader runs at
 * priority 10) and after typical third-party registrations. Post types
 * registered after `init` priority 100 are not covered, matching WordPress's
 * own constraint that post types must be registered during `init` to be
 * available via REST.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

if ( ! function_exists( 'gutenberg_get_default_post_type_fields' ) ) {
	/**
	 * Builds the serializable field definitions of the default field
	 * collection for a post type.
	 *
	 * Pure function of the post type's registered supports, the current
	 * theme's supports, and the slug — the same inputs the client-side
	 * fallback evaluates. Field order matches the fallback order exactly.
	 *
	 * The `preview` field is deliberately excluded: it is client-only (its
	 * implementation depends on editor internals) and is handled by a
	 * separate workstream.
	 *
	 * @param string $post_type Post type slug.
	 * @return array Array of serializable field definitions.
	 */
	function gutenberg_get_default_post_type_fields( $post_type ) {
		$design_post_types   = array( 'wp_template', 'wp_template_part', 'wp_block', 'wp_navigation' );
		$is_design_post_type = in_array( $post_type, $design_post_types, true );

		$featured_image = array(
			'id'            => 'featured_media',
			'type'          => 'media',
			'label'         => __( 'Featured Image', 'gutenberg' ),
			'placeholder'   => __( 'Set featured image', 'gutenberg' ),
			'enableSorting' => false,
			'filterBy'      => false,
		);

		$author = array(
			'id'       => 'author',
			'type'     => 'integer',
			'label'    => __( 'Author', 'gutenberg' ),
			'filterBy' => array(
				'operators' => array( 'isAny', 'isNone' ),
			),
		);

		// The `elements` of the status field live in the script module: each
		// element carries an icon, which is not serializable.
		$status = array(
			'id'            => 'status',
			'type'          => 'text',
			'label'         => __( 'Status', 'gutenberg' ),
			'Edit'          => 'radio',
			'enableSorting' => false,
			'filterBy'      => array(
				'operators' => array( 'isAny' ),
			),
		);

		$date = array(
			'id'       => 'date',
			'type'     => 'datetime',
			'label'    => __( 'Date', 'gutenberg' ),
			'filterBy' => array(
				'operators' => array( 'before', 'after' ),
			),
		);

		$scheduled_date = array(
			'id'            => 'scheduled_date',
			'type'          => 'datetime',
			'label'         => __( 'Scheduled Date', 'gutenberg' ),
			'Edit'          => array(
				'control' => 'datetime',
				'compact' => true,
			),
			'enableHiding'  => false,
			'enableSorting' => false,
			'filterBy'      => false,
		);

		$slug = array(
			'id'       => 'slug',
			'type'     => 'text',
			'label'    => __( 'Slug', 'gutenberg' ),
			'filterBy' => false,
		);

		// The `description` of the excerpt field lives in the script module:
		// it carries a link element, which is not serializable.
		$excerpt = array(
			'id'            => 'excerpt',
			'type'          => 'text',
			'label'         => __( 'Excerpt', 'gutenberg' ),
			'placeholder'   => __( 'Add an excerpt', 'gutenberg' ),
			'Edit'          => array(
				'control' => 'textarea',
				'rows'    => 4,
			),
			'enableSorting' => false,
			'filterBy'      => false,
		);

		$parent = array(
			'id'            => 'parent',
			'type'          => 'text',
			'label'         => __( 'Parent', 'gutenberg' ),
			'enableSorting' => true,
			'filterBy'      => false,
		);

		$comment_status = array(
			'id'            => 'comment_status',
			'type'          => 'text',
			'label'         => __( 'Comments', 'gutenberg' ),
			'Edit'          => 'radio',
			'enableSorting' => false,
			'enableHiding'  => false,
			'filterBy'      => false,
			'elements'      => array(
				array(
					'value'       => 'open',
					'label'       => __( 'Open', 'gutenberg' ),
					'description' => __( 'Visitors can add new comments and replies.', 'gutenberg' ),
				),
				array(
					'value'       => 'closed',
					'label'       => __( 'Closed', 'gutenberg' ),
					'description' => __( 'Visitors cannot add new comments or replies. Existing comments remain visible.', 'gutenberg' ),
				),
			),
		);

		$ping_status = array(
			'id'            => 'ping_status',
			'type'          => 'text',
			'label'         => __( 'Trackbacks & Pingbacks', 'gutenberg' ),
			'enableSorting' => false,
			'enableHiding'  => false,
			'filterBy'      => false,
			'elements'      => array(
				array(
					'value'       => 'open',
					'label'       => __( 'Allow', 'gutenberg' ),
					'description' => __( 'Allow link notifications from other blogs (pingbacks and trackbacks) on new articles.', 'gutenberg' ),
				),
				array(
					'value'       => 'closed',
					'label'       => __( "Don't allow", 'gutenberg' ),
					'description' => __( "Don't allow link notifications from other blogs (pingbacks and trackbacks) on new articles.", 'gutenberg' ),
				),
			),
		);

		$discussion = array(
			'id'       => 'discussion',
			'type'     => 'text',
			'label'    => __( 'Discussion', 'gutenberg' ),
			'filterBy' => false,
		);

		$template = array(
			'id'            => 'template',
			'type'          => 'text',
			'label'         => __( 'Template', 'gutenberg' ),
			'enableSorting' => false,
			'filterBy'      => false,
		);

		// The `elements` of the format field live in the script module: they
		// are resolved at runtime from the formats the theme declares support
		// for.
		$format = array(
			'id'            => 'format',
			'type'          => 'text',
			'label'         => __( 'Format', 'gutenberg' ),
			'Edit'          => 'radio',
			'enableSorting' => false,
			'enableHiding'  => false,
			'filterBy'      => false,
		);

		$post_content_info = array(
			'id'            => 'post-content-info',
			'type'          => 'text',
			'label'         => __( 'Post content information', 'gutenberg' ),
			'readOnly'      => true,
			'enableSorting' => false,
			'enableHiding'  => false,
			'filterBy'      => false,
		);

		$password = array(
			'id'            => 'password',
			'type'          => 'text',
			'label'         => __( 'Password', 'gutenberg' ),
			'enableSorting' => false,
			'enableHiding'  => false,
			'filterBy'      => false,
		);

		$sticky = array(
			'id'            => 'sticky',
			'type'          => 'boolean',
			'label'         => __( 'Sticky', 'gutenberg' ),
			'description'   => __( 'Pin this post to the top of the blog.', 'gutenberg' ),
			'enableSorting' => false,
			'enableHiding'  => false,
			'filterBy'      => false,
		);

		$notes_count = array(
			'id'            => 'notesCount',
			'type'          => 'integer',
			'label'         => __( 'Notes', 'gutenberg' ),
			'enableSorting' => false,
			'filterBy'      => false,
		);

		$title = array(
			'id'                 => 'title',
			'type'               => 'text',
			'label'              => __( 'Title', 'gutenberg' ),
			'placeholder'        => __( 'No title', 'gutenberg' ),
			'enableHiding'       => true,
			'enableGlobalSearch' => true,
			'filterBy'           => false,
		);

		$fields = array();

		// Unlike post type supports, theme support is per-site state, so the
		// checks the editor used to apply client-side have to stay runtime
		// conditions.
		if ( post_type_supports( $post_type, 'thumbnail' ) && current_theme_supports( 'post-thumbnails' ) ) {
			$fields[] = $featured_image;
		}

		if ( post_type_supports( $post_type, 'author' ) ) {
			$fields[] = $author;
		}

		$fields[] = $status;

		if ( ! $is_design_post_type ) {
			$fields[] = $date;
			$fields[] = $scheduled_date;
		}

		$fields[] = $slug;

		if ( ! $is_design_post_type && post_type_supports( $post_type, 'excerpt' ) ) {
			$fields[] = $excerpt;
		}

		if ( post_type_supports( $post_type, 'page-attributes' ) ) {
			$fields[] = $parent;
		}

		if ( post_type_supports( $post_type, 'comments' ) ) {
			$fields[] = $comment_status;
		}

		if ( post_type_supports( $post_type, 'trackbacks' ) ) {
			$fields[] = $ping_status;
		}

		if ( post_type_supports( $post_type, 'comments' ) || post_type_supports( $post_type, 'trackbacks' ) ) {
			$fields[] = $discussion;
		}

		$fields[] = $template;

		if ( post_type_supports( $post_type, 'post-formats' ) && current_theme_supports( 'post-formats' ) ) {
			$fields[] = $format;
		}

		if ( ! $is_design_post_type && post_type_supports( $post_type, 'editor' ) ) {
			$fields[] = $post_content_info;
		}

		$fields[] = $password;

		if ( 'post' === $post_type ) {
			$fields[] = $sticky;
		}

		// Mirrors the client-side `hasEditorNotesSupport`: the editor support
		// must have been registered with args, e.g.
		// `'supports' => array( 'editor' => array( 'notes' => true ) )`.
		$supports = get_all_post_type_supports( $post_type );
		if ( is_array( $supports['editor'] ?? null ) && ! empty( $supports['editor'][0]['notes'] ) ) {
			$fields[] = $notes_count;
		}

		if ( post_type_supports( $post_type, 'title' ) ) {
			$fields[] = $title;
		}

		return $fields;
	}
}

if ( ! function_exists( 'gutenberg_register_default_post_type_field_collections' ) ) {
	/**
	 * Registers the default field collection for every REST-enabled post type
	 * that does not already have one.
	 *
	 * Hand-written core collections and third-party collections registered
	 * earlier on `init` take precedence: registering a collection for a post
	 * type is the override mechanism that keeps the generic one away. The
	 * registry's id-based dedupe (`core/{$post_type}-fields`) is a second
	 * safety net.
	 */
	function gutenberg_register_default_post_type_field_collections() {
		$post_types = get_post_types( array( 'show_in_rest' => true ) );

		foreach ( $post_types as $post_type ) {
			if ( ! empty( gutenberg_get_field_collections( 'postType', $post_type ) ) ) {
				continue;
			}

			gutenberg_register_field_collection(
				"core/{$post_type}-fields",
				'postType',
				$post_type,
				gutenberg_get_default_post_type_fields( $post_type ),
				'@wordpress/fields/postType-default'
			);
		}
	}
}

// This file is required during `init` at priority 10 (see
// `gutenberg_register_core_field_collections()`); adding a later-priority
// callback for the currently running action is safe in WordPress.
add_action( 'init', 'gutenberg_register_default_post_type_field_collections', 100 );
