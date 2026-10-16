<?php
/**
 * The default comment status. The editor summary form maps this field to the
 * `root/site` entity.
 *
 * @package WordPress
 */

return array(
	'type'          => 'text',
	'label'         => __( 'Discussion', 'gutenberg' ),
	'Edit'          => 'radio',
	'elements'      => array(
		array(
			'value'       => 'open',
			'label'       => __( 'Open', 'gutenberg' ),
			'description' => __( 'Visitors can add new comments and replies.', 'gutenberg' ),
		),
		array(
			'value'       => '',
			'label'       => __( 'Closed', 'gutenberg' ),
			'description' => __( 'Visitors cannot add new comments or replies. Existing comments remain visible.', 'gutenberg' ),
		),
	),
	'enableSorting' => false,
	'enableHiding'  => false,
	'filterBy'      => false,
);
