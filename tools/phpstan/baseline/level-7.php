<?php declare(strict_types = 1);

$ignoreErrors = [];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$haystack of function str_ends_with expects string\\|null, string\\|true given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-supports/background.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$haystack of function str_ends_with expects string\\|null, string\\|true given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-supports/dimensions.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.notFound
	'message' => '#^Offset \'hover_selector\' does not exist on array\\{selector\\: non\\-falsy\\-string, hover_selector\\?\\: non\\-falsy\\-string, skip\\: false\\}\\|array\\{selector\\: non\\-falsy\\-string, skip\\: false, elements\\: array\\{\'h1\', \'h2\', \'h3\', \'h4\', \'h5\', \'h6\'\\}\\}\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-supports/elements.php',
];
$ignoreErrors[] = [
	// identifier: encapsedStringPart.nonString
	'message' => '#^Part \\$process_value \\(array\\<string\\>\\|string\\) of encapsed string cannot be cast to string\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/block-supports/layout.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#3 \\$subject of function preg_replace expects array\\|string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-template-utils.php',
];
$ignoreErrors[] = [
	// identifier: return.type
	'message' => '#^Function _gutenberg_filter_post_meta_footnotes\\(\\) should return string but returns string\\|false\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/blocks.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$json of function json_decode expects string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/blocks.php',
];
$ignoreErrors[] = [
	// identifier: return.type
	'message' => '#^Method WP_Duotone_Gutenberg\\:\\:get_filter_svg\\(\\) should return string but returns string\\|false\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.notFound
	'message' => '#^Offset 5 does not exist on array\\{0\\: string, 1\\: string, 2\\: string, 3\\: string, 4\\: string, 5\\?\\: string, 6\\?\\: string\\}\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.notFound
	'message' => '#^Offset 6 does not exist on array\\{0\\: string, 1\\: string, 2\\: string, 3\\: string, 4\\: string, 5\\: non\\-empty\\-string, 6\\?\\: string\\}\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.notFound
	'message' => '#^Offset 6 does not exist on array\\{0\\: string, 1\\: string, 2\\: string, 3\\: string, 4\\: string, 5\\: string, 6\\?\\: string, 7\\?\\: string, \\.\\.\\.\\}\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.notFound
	'message' => '#^Offset 7 does not exist on array\\{0\\: string, 1\\: string, 2\\: string, 3\\: string, 4\\: string, 5\\: string, 6\\: string, 7\\?\\: string, \\.\\.\\.\\}\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.notFound
	'message' => '#^Offset 8 does not exist on array\\{0\\: string, 1\\: string, 2\\: string, 3\\: string, 4\\: string, 5\\: string, 6\\: string, 7\\: non\\-empty\\-string, \\.\\.\\.\\}\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$str of function explode expects string, string\\|true\\|null given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#3 \\$subject of function preg_replace expects array\\|string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: method.notFound
	'message' => '#^Call to an undefined method WP_Error\\|WP_REST_Response\\:\\:add_links\\(\\)\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-rest-global-styles-controller-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$response of method WP_REST_Controller\\:\\:prepare_response_for_collection\\(\\) expects WP_REST_Response, WP_Error\\|WP_REST_Response given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-rest-global-styles-controller-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: binaryOp.invalid
	'message' => '#^Binary operation "\\." between array\\|string and \' \' results in an error\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.nonOffsetAccessible
	'message' => '#^Cannot access offset \'selectors\' on object\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.nonOffsetAccessible
	'message' => '#^Cannot access offset mixed on object\\.$#',
	'count' => 4,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$block_type of function wp_get_block_css_selector expects WP_Block_Type, object given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: encapsedStringPart.nonString
	'message' => '#^Part \\$block_gap_value \\(array\\|string\\) of encapsed string cannot be cast to string\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: return.type
	'message' => '#^Method WP_Theme_JSON_Resolver_Gutenberg\\:\\:translate\\(\\) should return array but returns array\\<array\\|string\\>\\|string\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$obj of function get_object_vars expects object, int\\|WP_Post given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: assign.propertyType
	'message' => '#^Static property WP_Theme_JSON_Resolver_Gutenberg\\:\\:\\$theme \\(WP_Theme_JSON_Gutenberg\\) does not accept WP_Theme_JSON\\|WP_Theme_JSON_Gutenberg\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: foreach.nonIterable
	'message' => '#^Argument of an invalid type array\\<int, string\\>\\|false supplied for foreach, only iterables are supported\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/client-assets.php',
];
$ignoreErrors[] = [
	// identifier: property.nonObject
	'message' => '#^Cannot access property \\$args on _WP_Dependency\\|true\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/client-assets.php',
];
$ignoreErrors[] = [
	// identifier: property.nonObject
	'message' => '#^Cannot access property \\$deps on _WP_Dependency\\|true\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/client-assets.php',
];
$ignoreErrors[] = [
	// identifier: property.nonObject
	'message' => '#^Cannot access property \\$src on _WP_Dependency\\|true\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/client-assets.php',
];
$ignoreErrors[] = [
	// identifier: property.nonObject
	'message' => '#^Cannot access property \\$ver on _WP_Dependency\\|true\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/client-assets.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$post of function _build_block_template_result_from_post expects WP_Post, int\\|WP_Post given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/block-template-utils.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$template_type of function _build_block_template_result_from_file expects \'wp_template\'\\|\'wp_template_part\', string given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/block-template-utils.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Error\\|WP_Post\\:\\:\\$ID\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/class-gutenberg-rest-global-styles-revisions-controller-6-6.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$theme_json of static method WP_Theme_JSON_Resolver_Gutenberg\\:\\:get_resolved_theme_uris\\(\\) expects WP_Theme_JSON_Gutenberg, array\\|WP_Theme_JSON_Gutenberg given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/class-gutenberg-rest-global-styles-revisions-controller-6-6.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.nonOffsetAccessible
	'message' => '#^Cannot access offset 1 on array\\|false\\.$#',
	'count' => 8,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/class-gutenberg-token-map-6-6.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$callback of function usort expects callable\\(int\\|string, int\\|string\\)\\: int, \'static\\:\\:longest…\' given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/class-gutenberg-token-map-6-6.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$item_updated\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/post.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$args of method WP_Block_Templates_Registry\\:\\:register\\(\\) expects array, array\\|string given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/block-templates.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$path of function wp_normalize_path expects string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/blocks.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$item of method WP_REST_Posts_Controller\\:\\:prepare_item_for_response\\(\\) expects WP_Post, int\\|WP_Post given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-posts-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$post of method WP_REST_Posts_Controller\\:\\:check_read_permission\\(\\) expects WP_Post, int\\|WP_Post given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-posts-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$posts of function update_post_author_caches expects array\\<WP_Post\\>, array\\<int\\|WP_Post\\> given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-posts-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$posts of function update_post_parent_caches expects array\\<WP_Post\\>, array\\<int\\|WP_Post\\> given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-posts-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#3 \\$length of function substr expects int, int\\<0, max\\>\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-server.php',
];
$ignoreErrors[] = [
	// identifier: method.notFound
	'message' => '#^Call to an undefined method WP_Error\\|WP_REST_Response\\:\\:add_link\\(\\)\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: method.notFound
	'message' => '#^Call to an undefined method WP_Error\\|WP_REST_Response\\:\\:add_links\\(\\)\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: return.type
	'message' => '#^Method Gutenberg_REST_Templates_Controller_6_7\\:\\:prepare_item_for_response\\(\\) should return WP_REST_Response but returns WP_Error\\|WP_REST_Response\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$template_type of function get_block_file_template expects \'wp_template\'\\|\'wp_template_part\', string given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$template_type of function get_block_template expects \'wp_template\'\\|\'wp_template_part\', string given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: offsetAccess.nonOffsetAccessible
	'message' => '#^Cannot access offset 1 on array\\|false\\.$#',
	'count' => 8,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$callback of function usort expects callable\\(int\\|string, int\\|string\\)\\: int, \'WP_Token_Map\\:…\' given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$data of function wp_print_inline_script_tag expects string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/script-modules.php',
];
$ignoreErrors[] = [
	// identifier: return.type
	'message' => '#^Function gutenberg_default_demo_content\\(\\) should return string but returns string\\|false\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/demo.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$var of function count expects array\\|Countable, array\\<int, string\\>\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/full-page-client-side-navigation.php',
];
$ignoreErrors[] = [
	// identifier: return.type
	'message' => '#^Function gutenberg_filter_global_styles_post\\(\\) should return string but returns bool\\|string\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/kses.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$content\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$db_id\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$object\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$title\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$type\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$type_label\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$ID\\.$#',
	'count' => 3,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$filter\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$post_date\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$post_name\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$post_parent\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$post_status\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$post_title\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$post_type\\.$#',
	'count' => 3,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$post of function get_permalink expects int\\|WP_Post, object given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$str of function strrev expects string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#3 \\$subject of function str_replace expects array\\|string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$path of function wp_normalize_path expects string, string\\|false given\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/experimental/script-modules.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$src of function wp_register_script_module expects string, string\\|false given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/script-modules.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$str of function md5 expects string, string\\|false given\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/global-styles-and-settings.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Error\\|WP_Term\\:\\:\\$term_id\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/upgrade.php',
];
$ignoreErrors[] = [
	// identifier: property.nonObject
	'message' => '#^Cannot access property \\$ID on int\\|WP_Post\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/upgrade.php',
];

return ['parameters' => ['ignoreErrors' => $ignoreErrors]];
