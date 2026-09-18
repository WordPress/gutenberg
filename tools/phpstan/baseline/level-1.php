<?php declare(strict_types = 1);

$ignoreErrors = [];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Function remove_filter invoked with 4 parameters, 2\\-3 required\\.$#',
	'count' => 4,
	'path' => __DIR__ . '/../../../lib/block-supports/elements.php',
];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Function remove_filter invoked with 4 parameters, 2\\-3 required\\.$#',
	'count' => 3,
	'path' => __DIR__ . '/../../../lib/block-supports/layout.php',
];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Function remove_filter invoked with 4 parameters, 2\\-3 required\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/block-supports/settings.php',
];
$ignoreErrors[] = [
	// identifier: variable.undefined
	'message' => '#^Variable \\$filter_id might not be defined\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: isset.variable
	'message' => '#^Variable \\$area in isset\\(\\) always exists and is not nullable\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/block-template-utils.php',
];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Class WP_Webfonts constructor invoked with 1 parameter, 0 required\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/font-face/bc-layer/webfonts-deprecations.php',
];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Function gutenberg_url invoked with 2 parameters, 1 required\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/posts/load.php',
];
$ignoreErrors[] = [
	// identifier: variable.undefined
	'message' => '#^Variable \\$cache_key might not be defined\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/global-styles-and-settings.php',
];
$ignoreErrors[] = [
	// identifier: variable.undefined
	'message' => '#^Variable \\$cached might not be defined\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/global-styles-and-settings.php',
];

return ['parameters' => ['ignoreErrors' => $ignoreErrors]];
