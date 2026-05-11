<?php return array(
	'dependencies' => array(
		'@wordpress/interactivity',
		'test/router-script-modules-alpha-1',
		'test/router-script-modules-initial-1',
		array(
			'id'     => 'test/router-script-modules-alpha-2',
			'import' => 'dynamic',
		),
		array(
			'id'     => 'test/router-script-modules-initial-2',
			'import' => 'dynamic',
		),
	),
);
