<?php
/**
 * Serializable field definitions for the `core/media-fields` field collection.
 *
 * The non-serializable extensions (getValue, render, Edit…) live in the
 * collocated `extensions.ts`, exposed as the
 * `@wordpress/fields/postType-attachment` script module.
 *
 * This file is copied to `build/scripts/fields/collections/postType-attachment/fields.php`
 * by the `wpCopyFiles` config in the package's package.json, and required on
 * `init` by `gutenberg_register_core_field_collections()`.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

$date_added = array(
	'id'       => 'date',
	'type'     => 'datetime',
	'label'    => __( 'Date added', 'gutenberg' ),
	'filterBy' => array(
		'operators' => array( 'before', 'after' ),
	),
	'readOnly' => true,
);

$author = array(
	'id'       => 'author',
	'type'     => 'integer',
	'label'    => __( 'Author', 'gutenberg' ),
	'filterBy' => array(
		'operators' => array( 'isAny', 'isNone' ),
	),
	'readOnly' => true,
);

$filename = array(
	'id'            => 'filename',
	'type'          => 'text',
	'label'         => __( 'File name', 'gutenberg' ),
	'enableSorting' => false,
	'filterBy'      => false,
	'readOnly'      => true,
);

// Sorting is disabled until the REST API supports ordering by `mime_type`.
// See: https://core.trac.wordpress.org/ticket/64073.
$mime_type = array(
	'id'            => 'mime_type',
	'type'          => 'text',
	'label'         => __( 'File type', 'gutenberg' ),
	'enableSorting' => false,
	'filterBy'      => false,
	'readOnly'      => true,
);

$filesize = array(
	'id'            => 'filesize',
	'type'          => 'text',
	'label'         => __( 'File size', 'gutenberg' ),
	'enableSorting' => false,
	'filterBy'      => false,
	'readOnly'      => true,
);

$media_dimensions = array(
	'id'            => 'media_dimensions',
	'type'          => 'text',
	'label'         => __( 'Dimensions', 'gutenberg' ),
	'enableSorting' => false,
	'filterBy'      => false,
	'readOnly'      => true,
);

$attached_to = array(
	'id'            => 'attached_to',
	'type'          => 'text',
	'label'         => __( 'Attached to', 'gutenberg' ),
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

$alt_text = array(
	'id'            => 'alt_text',
	'type'          => 'text',
	'label'         => __( 'Alt text', 'gutenberg' ),
	'enableSorting' => false,
	'filterBy'      => false,
);

$caption = array(
	'id'            => 'caption',
	'type'          => 'text',
	'label'         => __( 'Caption', 'gutenberg' ),
	'enableSorting' => false,
	'filterBy'      => false,
);

$description = array(
	'id'            => 'description',
	'type'          => 'text',
	'label'         => __( 'Description', 'gutenberg' ),
	'enableSorting' => false,
	'filterBy'      => false,
);

/*
 * Field order follows a logical grouping:
 * 1. Metadata fields in panels (date, author, file info).
 * 2. Core editable fields (title, alt text, caption, description).
 *
 * Note: media_thumbnail is not included as it's shown in the canvas preview.
 */
gutenberg_register_field_collection(
	'core/media-fields',
	'postType',
	'attachment',
	array(
		$date_added,
		$author,
		$filename,
		$mime_type,
		$filesize,
		$media_dimensions,
		$attached_to,
		$title,
		$alt_text,
		$caption,
		$description,
	),
	'@wordpress/fields/postType-attachment'
);
