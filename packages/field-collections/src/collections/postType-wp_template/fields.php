<?php
/**
 * Serializable field definitions for the `core/template-fields` field collection.
 *
 * The non-serializable extensions (getValue, render, Edit…) live in the
 * collocated `extensions.ts`, exposed as the
 * `@wordpress/field-collections/postType-wp_template` script module.
 *
 * This file is copied to `build/scripts/field-collections/collections/postType-wp_template/fields.php`
 * by the `wpCopyFiles` config in the package's package.json, and required on
 * `init` by `gutenberg_register_core_field_collections()`.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

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
	'label'              => __( 'Template', 'gutenberg' ),
	'placeholder'        => __( 'No title', 'gutenberg' ),
	'enableHiding'       => false,
	'enableGlobalSearch' => true,
	'filterBy'           => false,
);

gutenberg_register_field_collection(
	'core/template-fields',
	'postType',
	'wp_template',
	array(
		$author,
		$status,
		$slug,
		$template,
		$password,
		$title,
	),
	'@wordpress/field-collections/postType-wp_template'
);
