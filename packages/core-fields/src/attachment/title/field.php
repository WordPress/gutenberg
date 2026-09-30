<?php
/**
 * The title of the media, a copy of the `title` field of `@wordpress/fields`.
 * Its JavaScript parts (`getValue` and `render`) are in `field.tsx`, next to
 * this file.
 *
 * @package WordPress
 */

return array(
	'type'               => 'text',
	'label'              => __( 'Title', 'gutenberg' ),
	'placeholder'        => __( 'No title', 'gutenberg' ),
	'enableHiding'       => true,
	'enableGlobalSearch' => true,
	'filterBy'           => false,
);
