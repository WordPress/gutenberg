<?php
/**
 * The title of a page, a copy of the page title field of `@wordpress/fields`.
 * Its JavaScript parts (`getValue` and `render`) are in `field.tsx`, next to
 * this file: the render adds a badge to the homepage, the posts page, and
 * the privacy policy page.
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
