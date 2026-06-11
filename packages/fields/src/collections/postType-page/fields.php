<?php
/**
 * Serializable field definitions for the `core/page-fields` field collection.
 *
 * The non-serializable extensions (getValue, render) live in the collocated
 * `extensions.ts`, exposed as the `@wordpress/fields/postType-page` script
 * module.
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

gutenberg_register_field_collection(
	'core/page-fields',
	'postType',
	'page',
	array(
		$comment_status,
		$notes_count,
		$title,
	),
	'@wordpress/fields/postType-page'
);
