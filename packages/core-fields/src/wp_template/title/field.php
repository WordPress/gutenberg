<?php
/**
 * The title of a template, a copy of the template title field of
 * `@wordpress/fields`. Its JavaScript parts (`getValue` and `render`) are in
 * `field.tsx`, next to this file.
 *
 * @package WordPress
 */

return array(
	'type'               => 'text',
	'label'              => __( 'Template', 'gutenberg' ),
	'placeholder'        => __( 'No title', 'gutenberg' ),
	'enableHiding'       => false,
	'enableGlobalSearch' => true,
	'filterBy'           => false,
);
