<?php
/**
 * The comment status field of the post types supporting comments. It is
 * plain data: it has no JavaScript parts.
 *
 * @package gutenberg
 */

return array(
	'type'          => 'text',
	'label'         => __( 'Comments', 'gutenberg' ),
	'Edit'          => 'radio',
	'enableSorting' => false,
	'enableHiding'  => false,
	'filterBy'      => false,
	'elements'      => array(
		array(
			'value'       => 'open',
			'label'       => __( 'Open', 'gutenberg' ),
			'description' => __( 'Visitors can add new comments and replies.', 'gutenberg' ),
		),
		array(
			'value'       => 'closed',
			'label'       => __( 'Closed', 'gutenberg' ),
			'description' => __( 'Visitors cannot add new comments or replies. Existing comments remain visible.', 'gutenberg' ),
		),
	),
);
