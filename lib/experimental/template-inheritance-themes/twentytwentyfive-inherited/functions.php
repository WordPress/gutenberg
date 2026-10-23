<?php
/**
 * Twenty Twenty-Five Inherited functions.
 *
 * @package twentytwentyfive-inherited
 */

/*
 * Makes the Index template the parent of every other template this theme
 * ships, unless the template has a parent of its own.
 */
add_filter(
	'gutenberg_template_parent',
	static function ( $parent_slug, $template ) {
		$inherits_index = array( '404', 'archive', 'home', 'page', 'page-no-title', 'search', 'single' );

		if ( '' === $parent_slug && in_array( $template->slug, $inherits_index, true ) ) {
			return 'index';
		}

		return $parent_slug;
	},
	10,
	2
);
