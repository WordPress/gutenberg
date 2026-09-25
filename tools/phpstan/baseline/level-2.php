<?php declare(strict_types = 1);

$ignoreErrors = [];
$ignoreErrors[] = [
	// identifier: binaryOp.invalid
	'message' => '#^Binary operation "/" between string and 255 results in an error\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/block-supports/duotone.php',
];
$ignoreErrors[] = [
	// identifier: method.void
	'message' => '#^Result of method WP_HTML_Tag_Processor\\:\\:class_list\\(\\) \\(void\\) is used\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-supports/layout.php',
];
$ignoreErrors[] = [
	// identifier: binaryOp.invalid
	'message' => '#^Binary operation "/" between string and 255 results in an error\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Gutenberg\\:\\:compute_spacing_sizes\\(\\) through static\\:\\:\\.$#',
	'count' => 3,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Gutenberg\\:\\:get_block_nodes\\(\\) through static\\:\\:\\.$#',
	'count' => 3,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Gutenberg\\:\\:merge_spacing_sizes\\(\\) through static\\:\\:\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Gutenberg\\:\\:remove_indirect_properties\\(\\) through static\\:\\:\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Gutenberg\\:\\:resolve_custom_css_format\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Gutenberg\\:\\:unwrap_shared_block_style_variations\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Gutenberg\\:\\:update_separator_declarations\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: phpDoc.parseError
	'message' => '#^PHPDoc tag @param has invalid value \\(WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data\\.\\)\\: Unexpected token "Class", expected variable at offset 148$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: phpDoc.parseError
	'message' => '#^PHPDoc tag @param has invalid value \\(WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data\\.\\)\\: Unexpected token "Class", expected variable at offset 154$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: phpDoc.parseError
	'message' => '#^PHPDoc tag @param has invalid value \\(WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data\\.\\)\\: Unexpected token "Class", expected variable at offset 155$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: phpDoc.parseError
	'message' => '#^PHPDoc tag @param has invalid value \\(WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data\\.\\)\\: Unexpected token "Class", expected variable at offset 156$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Resolver_Gutenberg\\:\\:inject_variations_from_block_style_variation_files\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Resolver_Gutenberg\\:\\:inject_variations_from_block_styles_registry\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Resolver_Gutenberg\\:\\:recursively_iterate_json\\(\\) through static\\:\\:\\.$#',
	'count' => 3,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Resolver_Gutenberg\\:\\:remove_json_comments\\(\\) through static\\:\\:\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method WP_Theme_JSON_Resolver_Gutenberg\\:\\:style_variation_has_scope\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: parameter.notFound
	'message' => '#^PHPDoc tag @param references unknown parameter\\: \\$source_args$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/block-bindings/pattern-overrides.php',
];
$ignoreErrors[] = [
	// identifier: parameter.notFound
	'message' => '#^PHPDoc tag @param references unknown parameter\\: \\$settings$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/block-bindings.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Block_Template\\:\\:\\$plugin\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Token_Map\\:\\:\\$groups\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Token_Map\\:\\:\\$key_length\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Token_Map\\:\\:\\$large_words\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Token_Map\\:\\:\\$small_mappings\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Token_Map\\:\\:\\$small_words\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Block_Template\\:\\:\\$plugin\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-wp-block-templates-registry.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Block_Template\\:\\:\\$plugin\\.$#',
	'count' => 5,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/compat.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property object\\:\\:\\$slug\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/compat.php',
];
$ignoreErrors[] = [
	// identifier: phpDoc.parseError
	'message' => '#^PHPDoc tag @param has invalid value \\(\\[WP_Block_Template\\|null\\] \\$block_template The found block template, or null if there isn’t one\\.\\)\\: Unexpected token "\\|", expected \'\\]\' at offset 115$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/compat.php',
];
$ignoreErrors[] = [
	// identifier: phpDoc.parseError
	'message' => '#^PHPDoc tag @return has invalid value \\(\\[WP_Block_Template\\|null\\] The block template that was already found with the plugin property defined if it was registered by a plugin\\.\\)\\: Unexpected token "\\|", expected \'\\]\' at offset 223$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/compat.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Block_Template\\:\\:\\$plugin\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/rest-api.php',
];
$ignoreErrors[] = [
	// identifier: method.notFound
	'message' => '#^Call to an undefined method object\\:\\:set\\(\\)\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.8/block-comments.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Post\\:\\:\\$content\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: property.notFound
	'message' => '#^Access to an undefined property WP_Post\\:\\:\\$type\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/experimental/navigation-theme-opt-in.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:clean_up_old_connections\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:get_contents_and_lock_file\\(\\) through static\\:\\:\\.$#',
	'count' => 6,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:get_contents_from_file_descriptor\\(\\) through static\\:\\:\\.$#',
	'count' => 4,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:handle_ping\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:handle_publish_message\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:handle_read_pending_messages\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:handle_subscribe_to_topics\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:handle_unsubscribe_from_topics\\(\\) through static\\:\\:\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:save_contents_and_unlock_file\\(\\) through static\\:\\:\\.$#',
	'count' => 3,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: staticClassAccess.privateMethod
	'message' => '#^Unsafe call to private method Gutenberg_HTTP_Signaling_Server\\:\\:save_contents_to_file_descriptor\\(\\) through static\\:\\:\\.$#',
	'count' => 6,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];

return ['parameters' => ['ignoreErrors' => $ignoreErrors]];
