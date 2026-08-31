<?php declare(strict_types = 1);

$ignoreErrors = [];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$separator of function explode expects string, float given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/block-supports/layout.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$args of function register_block_type expects array\\{api_version\\?\\: string, title\\?\\: string, category\\?\\: string\\|null, parent\\?\\: array\\<string\\>\\|null, ancestor\\?\\: array\\<string\\>\\|null, allowed_blocks\\?\\: array\\<string\\>\\|null, icon\\?\\: string\\|null, description\\?\\: string, \\.\\.\\.\\}, array\\{category\\: \'widgets\', attributes\\: array\\{url\\: array\\{type\\: \'string\'\\}, service\\: array\\{type\\: \'string\', default\\: \'amazon\'\\|\'bandcamp\'\\|\'behance\'\\|\'chain\'\\|\'codepen\'\\|\'deviantart\'\\|\'dribbble\'\\|\'dropbox\'\\|\'etsy\'\\|\'facebook\'\\|\'feed\'\\|\'fivehundredpx\'\\|\'flickr\'\\|\'foursquare\'\\|\'github\'\\|\'goodreads\'\\|\'google\'\\|\'instagram\'\\|\'lastfm\'\\|\'linkedin\'\\|\'mail\'\\|\'mastodon\'\\|\'medium\'\\|\'meetup\'\\|\'pinterest\'\\|\'pocket\'\\|\'reddit\'\\|\'skype\'\\|\'snapchat\'\\|\'soundcloud\'\\|\'spotify\'\\|\'tumblr\'\\|\'twitch\'\\|\'twitter\'\\|\'vimeo\'\\|\'vk\'\\|\'wordpress\'\\|\'yelp\'\\|\'youtube\'\\}, label\\: array\\{type\\: \'string\'\\}\\}, render_callback\\: \'gutenberg_render…\'\\} given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/blocks.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$value of static method WP_Duotone_Gutenberg\\:\\:colord_parse_hue\\(\\) expects float, string given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-duotone-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$incoming of method WP_Theme_JSON\\:\\:merge\\(\\) expects WP_Theme_JSON, WP_Theme_JSON_Gutenberg given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-data-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$css of method WP_Theme_JSON_Gutenberg\\:\\:process_blocks_custom_css\\(\\) expects string, array given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$metadata of method WP_Theme_JSON_Gutenberg\\:\\:get_feature_declarations_for_node\\(\\) expects object, array given\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$function_name of function _doing_it_wrong expects string, true given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/class-wp-theme-json-resolver-gutenberg.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#5 \\$media of function wp_register_style expects string, true given\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/client-assets.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$str of function strtoupper expects string, bool given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.6/class-gutenberg-token-map-6-6.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$value of method WP_HTTP_Response\\:\\:header\\(\\) expects string, int given\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-posts-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$id of method WP_REST_Templates_Controller\\:\\:prepare_links\\(\\) expects int, string given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#1 \\$str of function strtoupper expects string, bool given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#2 \\$value of function setcookie expects string, int given\\.$#',
	'count' => 2,
	'path' => __DIR__ . '/../../../lib/experimental/sync/class-gutenberg-http-signaling-server.php',
];
$ignoreErrors[] = [
	// identifier: argument.type
	'message' => '#^Parameter \\#5 \\$callback of function add_menu_page expects callable\\(\\)\\: mixed, \'\' given\\.$#',
	'count' => 1,
	'path' => __DIR__ . '/../../../lib/init.php',
];

return ['parameters' => ['ignoreErrors' => $ignoreErrors]];
