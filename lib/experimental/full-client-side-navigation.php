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
	return (string) $p;
}

add_filter( 'render_block', 'gutenberg_add_client_side_navigation_directives', 10, 1 );

// Add `data-wp-interactive` to the top level tag.
function gutenberg_interactivity_add_directives_csn( array $parsed_block ): array {
	static $root_block = null;

	/*
	 * Checks whether a root block is already annotated for
	 * processing, and if it is, it ignores the subsequent ones.
	 */
	if ( null === $root_block ) {
		$block_name = $parsed_block['blockName'];
		if ( isset( $block_name ) ) {
			// Annotates the root block for processing.
			$root_block = array( $block_name, $parsed_block );

			/*
			 * Adds a filter to process the root interactive block once it has
			 * finished rendering.
			 */
			$add_directive_to_root_block = static function ( string $content, array $parsed_block ) use ( &$root_block, &$add_directive_to_root_block ): string {
				// Checks whether the current block is the root block.
				list($root_block_name, $root_parsed_block) = $root_block;
				if ( $root_block_name === $parsed_block['blockName'] && $parsed_block === $root_parsed_block ) {
					// The root block has finished rendering, process it.
					$p = new WP_HTML_Tag_Processor( $content );
					if ( $p->next_tag() ) {
						$p->set_attribute( 'data-wp-interactive', 'core/experimental' );
					}
					$content = (string) $p;
					// Removes the filter and reset the root block.
					remove_filter( 'render_block_' . $parsed_block['blockName'], $add_directive_to_root_block );
					$root_block = null;
				}
				return $content;
			};

			add_filter( 'render_block_' . $block_name, $add_directive_to_root_block, 20, 2 );
		}
	}

	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_interactivity_add_directives_csn' );
