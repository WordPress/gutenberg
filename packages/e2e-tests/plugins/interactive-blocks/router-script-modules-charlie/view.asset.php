<?php return array(
	'dependencies' => array(
		'@wordpress/interactivity',
		'test/router-script-modules-charlie-1',
		'test/router-script-modules-initial-1',
		array(
			'id'     => 'test/router-script-modules-charlie-2',
			'import' => 'dynamic',
		),
		array(
			'id'     => 'test/router-script-modules-initial-2',
			'import' => 'dynamic',
		),
	),
);
