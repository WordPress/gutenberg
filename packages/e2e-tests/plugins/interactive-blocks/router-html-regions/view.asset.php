<?php
/**
 * Script module dependencies for HTML router regions.
 *
 * @package gutenberg-test-interactive-blocks
 */
return array(
	'dependencies' => array(
		'@wordpress/interactivity',
		array(
			'id'     => '@wordpress/interactivity-router',
			'import' => 'dynamic',
		),
	),
);
