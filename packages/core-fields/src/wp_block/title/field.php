<?php
/**
 * The title field of patterns, a copy of the pattern title field of
 * `@wordpress/fields`. Its JavaScript parts are in `field.tsx`.
 *
 * @package WordPress
 */

return array(
	'type'               => 'text',
	'label'              => __( 'Title', 'gutenberg' ),
	'placeholder'        => __( 'No title', 'gutenberg' ),
	'enableHiding'       => false,
	'enableGlobalSearch' => true,
	'filterBy'           => false,
);
