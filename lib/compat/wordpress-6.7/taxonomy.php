<?php
/**
 * Temporary compatibility code for post formats.
 *
 * @package gutenberg
 */

/**
 * Add support for the post format taxonomy in the REST API.
 * See wp-includes/taxonomy.php line 170.
 *
 * Needed to add post formats to the taxonomy filter in the query loop.
 *
 * @since 6.7.0
 */
add_filter(
	'register_post_format_taxonomy_args',
	function( $args ) {
		$args['show_in_rest'] = true;
		return $args;
	}
);
