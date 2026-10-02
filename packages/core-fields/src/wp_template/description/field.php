<?php
/**
 * The description of a template, editable for the custom templates users
 * create, a copy of the template description field of `@wordpress/fields`.
 * Its JavaScript parts (`getValue`, `render`, and `isVisible`) are in
 * `field.tsx`, next to this file.
 *
 * @package WordPress
 */

return array(
	'type'               => 'text',
	'label'              => __( 'Description', 'gutenberg' ),
	'placeholder'        => __( 'Add a description', 'gutenberg' ),
	'Edit'               => array(
		'control' => 'textarea',
		'rows'    => 4,
	),
	'enableSorting'      => false,
	'filterBy'           => false,
	'enableGlobalSearch' => true,
);
