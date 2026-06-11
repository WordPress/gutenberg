<?php
/**
 * Serializable field definitions for the `core/page-fields` field collection.
 *
 * The non-serializable extensions (getValue, render, Edit…) live in the
 * collocated `extensions.ts`, exposed as the `@wordpress/fields/postType-page`
 * script module.
 *
 * This file is copied to `build/scripts/fields/collections/postType-page/fields.php`
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
	'enableHiding'       => false,
	'enableGlobalSearch' => true,
	'filterBy'           => false,
);

$fields = array(
	$author,
	$status,
	$date,
	$scheduled_date,
	$slug,
	$parent,
	$comment_status,
	$discussion,
	$template,
	$post_content_info,
	$password,
	$notes_count,
	$title,
);

// Unlike post type supports, theme support is per-site state, so the check
// the editor used to apply client-side has to stay a runtime condition.
if ( current_theme_supports( 'post-thumbnails' ) ) {
	array_unshift( $fields, $featured_image );
}

gutenberg_register_field_collection(
	'core/page-fields',
	'postType',
	'page',
	$fields,
	'@wordpress/fields/postType-page'
);
