<?php
/**
 * The description field of patterns, which edits their excerpt.
 * Its JavaScript parts are in `field.tsx`.
 *
 * @package WordPress
 */

return array(
	'id'                 => 'excerpt',
	'type'               => 'text',
	'label'              => __( 'Description', 'gutenberg' ),
	'placeholder'        => __( 'Add a description', 'gutenberg' ),
	'Edit'               => array(
		'control' => 'textarea',
		'rows'    => 4,
	),
	'enableSorting'      => false,
	'enableHiding'       => false,
	'filterBy'           => false,
	'enableGlobalSearch' => true,
);
