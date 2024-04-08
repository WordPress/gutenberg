<?php

/**
 * Replaces pattern blocks with their content.
 *
 * @param array $blocks Array of blocks.
 * @param array $inner_content Optional array of inner content.
 * @return array Array of blocks with patterns replaced.
 */
function gutenberg_replace_pattern_blocks( $blocks, &$inner_content = null ) {
	// Keep track of seen references to avoid infinite loops.
	static $seen_refs = array();
	$i                = 0;
	while ( $i < count( $blocks ) ) {
		if ( 'core/pattern' === $blocks[ $i ]['blockName'] ) {
			$slug = $blocks[ $i ]['attrs']['slug'];

			if ( isset( $seen_refs[ $slug ] ) ) {
				// Skip recursive patterns.
				array_splice( $blocks, $i, 1 );
				continue;
			}

			$registry = WP_Block_Patterns_Registry::get_instance();
			$pattern  = $registry->get_registered( $slug );

			// Skip unknown patterns.
			if ( ! $pattern ) {
				++$i;
				continue;
			}

			$blocks_to_insert   = parse_blocks( $pattern['content'] );
			$seen_refs[ $slug ] = true;
			$blocks_to_insert   = gutenberg_replace_pattern_blocks( $blocks_to_insert );
			unset( $seen_refs[ $slug ] );
			array_splice( $blocks, $i, 1, $blocks_to_insert );

			// If we have inner content, we need to insert nulls in the
			// inner content array, otherwise serialize_blocks will skip
			// blocks.
			if ( $inner_content ) {
				$null_indices  = array_keys( $inner_content, null, true );
				$content_index = $null_indices[ $i ];
				$nulls         = array_fill( 0, count( $blocks_to_insert ), null );
				array_splice( $inner_content, $content_index, 1, $nulls );
			}

			// Skip inserted blocks.
			$i += count( $blocks_to_insert );
		} else {
			if ( ! empty( $blocks[ $i ]['innerBlocks'] ) ) {
				$blocks[ $i ]['innerBlocks'] = gutenberg_replace_pattern_blocks(
					$blocks[ $i ]['innerBlocks'],
					$blocks[ $i ]['innerContent']
				);
			}
			++$i;
		}
	}
	return $blocks;
}

function gutenberg_replace_pattern_blocks_get_block_templates( $templates ) {
	foreach ( $templates as $template ) {
		$blocks            = parse_blocks( $template->content );
		$blocks            = gutenberg_replace_pattern_blocks( $blocks );
		$template->content = serialize_blocks( $blocks );
	}
	return $templates;
}

function gutenberg_replace_pattern_blocks_get_block_template( $template ) {
	if ( null === $template ) {
		return $template;
	}
	$blocks            = parse_blocks( $template->content );
	$blocks            = gutenberg_replace_pattern_blocks( $blocks );
	$template->content = serialize_blocks( $blocks );
	return $template;
}

function gutenberg_replace_pattern_blocks_patterns_endpoint( $result, $server, $request ) {
	if ( $request->get_route() !== '/wp/v2/block-patterns/patterns' ) {
		return $result;
	}

	$data = $result->get_data();

	foreach ( $data as $index => $pattern ) {
		$blocks                    = parse_blocks( $pattern['content'] );
		$blocks                    = gutenberg_replace_pattern_blocks( $blocks );
		$data[ $index ]['content'] = serialize_blocks( $blocks );
	}

	$result->set_data( $data );

	return $result;
}

// For core merge, we should avoid the double parse and replace the patterns in templates here:
// https://github.com/WordPress/wordpress-develop/blob/02fb53498f1ce7e63d807b9bafc47a7dba19d169/src/wp-includes/block-template-utils.php#L558
add_filter( 'get_block_templates', 'gutenberg_replace_pattern_blocks_get_block_templates' );
add_filter( 'get_block_template', 'gutenberg_replace_pattern_blocks_get_block_template' );
// Similarly, for patterns, we can avoid the double parse here:
// https://github.com/WordPress/wordpress-develop/blob/02fb53498f1ce7e63d807b9bafc47a7dba19d169/src/wp-includes/class-wp-block-patterns-registry.php#L175
add_filter( 'rest_post_dispatch', 'gutenberg_replace_pattern_blocks_patterns_endpoint', 10, 3 );
