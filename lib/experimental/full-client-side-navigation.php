<?php
/**
 * Registers full client-side navigation option using the Interactivity API and adds the necessary directives.
 */

// Add the full client-side navigation config option.
wp_interactivity_config( 'core/router/experimental', array( 'fullClientSideNavigation' => true ) );

// Add directives to all links.
function gutenberg_add_client_side_navigation_directives( $content ) {
	$p = new WP_HTML_Tag_Processor( $content );
	while ( $p->next_tag( array( 'tag_name' => 'a' ) ) ) {
		$p->set_attribute( 'data-wp-on--click', 'core/router/experimental::actions.navigate' );
	}
	// Add `<body>` hack until we figure out a better way to add a global `data-wp-interactive`.
	return (string) $p . '<body data-wp-interactive="core/router/experimental"></body>';
}

add_filter( 'render_block', 'gutenberg_add_client_side_navigation_directives', 10, 1 );
