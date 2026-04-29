<?php return array(
	'dependencies' => array(
		'@wordpress/interactivity',
		array(
			'id'     => '@wordpress/interactivity-router',
			'import' => 'dynamic',
		),
		'test/router-script-modules-initial-1',
		array(
			'id'     => 'test/router-script-modules-initial-2',
			'import' => 'dynamic',
		),
	),
);
