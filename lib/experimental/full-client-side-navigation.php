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
	static $root_interactive_block = null;

	/*
	 * Checks whether a root interactive block is already annotated for
	 * processing, and if it is, it ignores the subsequent ones.
	 */
	if ( null === $root_interactive_block ) {
		$block_name = $parsed_block['blockName'];
		if ( isset( $block_name ) ) {
			// Annotates the root interactive block for processing.
			$root_interactive_block = array( $block_name, $parsed_block );

			/*
			 * Adds a filter to process the root interactive block once it has
			 * finished rendering.
			 */
			$process_interactive_blocks = static function ( string $content, array $parsed_block ) use ( &$root_interactive_block, &$process_interactive_blocks ): string {
				// Checks whether the current block is the root block.
				list($root_block_name, $root_parsed_block) = $root_interactive_block;
				if ( $root_block_name === $parsed_block['blockName'] && $parsed_block === $root_parsed_block ) {
					// The root interactive blocks has finished rendering, process it.
					$p = new WP_HTML_Tag_Processor( $content );
					if ( $p->next_tag() ) {
						$p->set_attribute( 'data-wp-interactive', 'core/experimental' );
					}
					$content = (string) $p;
					// Removes the filter and reset the root interactive block.
					remove_filter( 'render_block_' . $parsed_block['blockName'], $process_interactive_blocks );
					$root_interactive_block = null;
				}
				return $content;
			};

			add_filter( 'render_block_' . $block_name, $process_interactive_blocks, 20, 2 );
		}
	}

	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_interactivity_add_directives_csn' );
