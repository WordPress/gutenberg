<?php
/**
 * The read-only description of the templates themes and plugins provide,
 * whose description cannot be edited, a copy of the read-only template
 * description field of `@wordpress/fields`. Its JavaScript parts
 * (`getValue`, `render`, and `isVisible`) are in `field.tsx`, next to this
 * file.
 *
 * @package WordPress
 */

return array(
	'type'          => 'text',
	'label'         => __( 'Description', 'gutenberg' ),
	'readOnly'      => true,
	'enableSorting' => false,
	'enableHiding'  => false,
	'filterBy'      => false,
);
