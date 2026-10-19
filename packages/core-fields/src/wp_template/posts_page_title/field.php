<?php
/**
 * The title of the page assigned as the Posts Page. The editor summary form
 * maps this field to that page's title.
 *
 * @package WordPress
 */

return array(
	'type'          => 'text',
	'label'         => __( 'Blog title', 'gutenberg' ),
	'description'   => __( 'Set the Posts Page title. Appears in search results, and when the page is shared on social media.', 'gutenberg' ),
	'enableSorting' => false,
	'enableHiding'  => false,
	'filterBy'      => false,
);
