<?php declare(strict_types = 1);

$ignoreErrors = [];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Callback expects 1 parameter, \\$accepted_args is set to 2\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-supports/block-style-variations.php',
];
$ignoreErrors[] = [
	// identifier: return.missing
	'message' => '#^Function gutenberg_tinycolor_string_to_rgb\\(\\) should return array but return statement is missing\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-supports/duotone.php',
];
$ignoreErrors[] = [
	// identifier: return.missing
	'message' => '#^Method WP_Duotone_Gutenberg\\:\\:get_selector\\(\\) should return string but return statement is missing\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: return.missing
	'message' => '#^Method WP_Theme_JSON_Gutenberg\\:\\:should_override_preset\\(\\) should return bool but return statement is missing\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: phpDoc.parseError
	'message' => '#^One or more @param tags has an invalid name or invalid syntax\\.$#',
	'count' => 4,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: class.notFound
	'message' => '#^Call to static method get_stores\\(\\) on an unknown class WP_Style_Engine_CSS_Rules_Store_Gutenberg\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/client-assets.php',
];
$ignoreErrors[] = [
	// identifier: new.static
	'message' => '#^Unsafe usage of new static\\(\\)\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/class-gutenberg-token-map-6-6.php',
];
$ignoreErrors[] = [
	// identifier: return.missing
	'message' => '#^Method Gutenberg_REST_Templates_Controller_6_7\\:\\:get_wp_templates_author_text_field\\(\\) should return string but return statement is missing\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Callback expects 1 parameter, \\$accepted_args is set to 2\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/kses-allowed-html.php',
];
$ignoreErrors[] = [
	// identifier: arguments.count
	'message' => '#^Callback expects 1 parameter, \\$accepted_args is set to 2\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/rest-api.php',
];

return ['parameters' => ['ignoreErrors' => $ignoreErrors]];
