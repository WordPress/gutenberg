<?php
/**
 * Serializable field definitions for the `core/post-fields` field collection.
 *
 * The non-serializable extensions (getValue, render, Edit…) live in the
 * collocated `extensions.ts`, exposed as the `@wordpress/field-collections/postType-post`
 * script module.
 *
 * This file is copied to `build/scripts/field-collections/collections/postType-post/fields.php`
 * by the `wpCopyFiles` config in the package's package.json, and required on
 * `init` by `gutenberg_register_core_field_collections()`.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

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

// The `elements` of the status field live in the script module: each element
// carries an icon, which is not serializable.
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

// The `description` of the excerpt field lives in the script module: it
// carries a link element, which is not serializable.
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

// The `elements` of the format field live in the script module: they are
// resolved at runtime from the formats the theme declares support for.
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

$fields = array(
	$author,
	$status,
	$date,
	$scheduled_date,
	$slug,
	$excerpt,
	$comment_status,
	$ping_status,
	$discussion,
	$template,
);

// Unlike post type supports, theme support is per-site state, so the checks
// the editor used to apply client-side have to stay runtime conditions.
if ( current_theme_supports( 'post-formats' ) ) {
	$fields[] = $format;
}

$fields[] = $post_content_info;
$fields[] = $password;
$fields[] = $sticky;
$fields[] = $notes_count;
$fields[] = $title;

if ( current_theme_supports( 'post-thumbnails' ) ) {
	array_unshift( $fields, $featured_image );
}

gutenberg_register_field_collection(
	'core/post-fields',
	'postType',
	'post',
	$fields,
	'@wordpress/field-collections/postType-post'
);
