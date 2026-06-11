<?php
/**
 * Serializable field definitions for the `core/pattern-fields` field collection.
 *
 * The non-serializable extensions (getValue, render, Edit…) live in the
 * collocated `extensions.ts`, exposed as the
 * `@wordpress/fields/postType-wp_block` script module.
 *
 * This file is copied to `build/scripts/fields/collections/postType-wp_block/fields.php`
 * by the `wpCopyFiles` config in the package's package.json, and required on
 * `init` by `gutenberg_register_core_field_collections()`.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

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

$slug = array(
	'id'       => 'slug',
	'type'     => 'text',
	'label'    => __( 'Slug', 'gutenberg' ),
	'filterBy' => false,
);

$template = array(
	'id'            => 'template',
	'type'          => 'text',
	'label'         => __( 'Template', 'gutenberg' ),
	'enableSorting' => false,
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
	'core/pattern-fields',
	'postType',
	'wp_block',
	array(
		$status,
		$slug,
		$template,
		$password,
		$title,
	),
	'@wordpress/fields/postType-wp_block'
);
