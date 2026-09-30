<?php
/**
 * The read-only sync status field of patterns.
 * Its JavaScript parts are in `field.tsx`.
 *
 * @package WordPress
 */

return array(
	'id'            => 'sync-status',
	'type'          => 'text',
	'label'         => __( 'Sync status', 'gutenberg' ),
	'readOnly'      => true,
	'enableSorting' => false,
	'enableHiding'  => true,
	'elements'      => array(
		array(
			'value'       => 'fully',
			'label'       => _x( 'Synced', 'pattern (singular)', 'gutenberg' ),
			'description' => __( 'Patterns that are kept in sync across the site.', 'gutenberg' ),
		),
		array(
			'value'       => 'unsynced',
			'label'       => _x( 'Not synced', 'pattern (singular)', 'gutenberg' ),
			'description' => __( 'Patterns that can be changed freely without affecting the site.', 'gutenberg' ),
		),
	),
	'filterBy'      => array(
		'operators' => array( 'is' ),
		'isPrimary' => true,
	),
);
