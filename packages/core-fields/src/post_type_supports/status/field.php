<?php
/**
 * The status of a post, for every post type but the design ones. Its
 * JavaScript parts (`getValue`, `render`, and `isDisabled`) are in
 * `field.tsx`, next to this file; the render adds the icon of each status.
 *
 * Custom statuses are not supported, see
 * https://github.com/WordPress/gutenberg/issues/55886.
 *
 * @package WordPress
 */

return array(
	'type'          => 'text',
	'label'         => __( 'Status', 'gutenberg' ),
	'Edit'          => 'radio',
	'elements'      => array(
		array(
			'value'       => 'draft',
			'label'       => __( 'Draft', 'gutenberg' ),
			'description' => __( 'Not ready to publish.', 'gutenberg' ),
		),
		array(
			'value'       => 'future',
			'label'       => __( 'Scheduled', 'gutenberg' ),
			'description' => __( 'Publish automatically on a chosen date.', 'gutenberg' ),
		),
		array(
			'value'       => 'pending',
			'label'       => __( 'Pending Review', 'gutenberg' ),
			'description' => __( 'Waiting for review before publishing.', 'gutenberg' ),
		),
		array(
			'value'       => 'private',
			'label'       => __( 'Private', 'gutenberg' ),
			'description' => __( 'Only visible to site admins and editors.', 'gutenberg' ),
		),
		array(
			'value'       => 'publish',
			'label'       => __( 'Published', 'gutenberg' ),
			'description' => __( 'Visible to everyone.', 'gutenberg' ),
		),
		array(
			'value' => 'trash',
			'label' => __( 'Trash', 'gutenberg' ),
		),
	),
	'enableSorting' => false,
	'filterBy'      => array(
		'operators' => array( 'isAny' ),
	),
);
