<?php

if ( ! function_exists( 'gutenberg_replace_pattern_blocks' ) ) {
	/**
	 * Replaces pattern blocks with their content.
	 *
	 * @param array $blocks Array of blocks.
	 * @param array $inner_content Optional array of inner content.
	 * @return array Array of blocks with patterns replaced.
	 */
	function gutenberg_replace_pattern_blocks( $blocks, &$inner_content = null ) {
		$i = 0;
		// Also process new blocks that are inserted.
		while ( $i < count( $blocks ) ) {
			if ( 'core/pattern' === $blocks[ $i ]['blockName'] ) {
				$registry         = WP_Block_Patterns_Registry::get_instance();
				$pattern          = $registry->get_registered( $blocks[ $i ]['attrs']['slug'] );
				$pattern_content  = $pattern['content'];
				$blocks_to_insert = parse_blocks( $pattern_content );
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
			} elseif ( ! empty( $blocks[ $i ]['innerBlocks'] ) ) {
				$blocks[ $i ]['innerBlocks'] = gutenberg_replace_pattern_blocks(
					$blocks[ $i ]['innerBlocks'],
					$blocks[ $i ]['innerContent']
				);
			}
			++$i;
		}
		return $blocks;
	}
}

add_filter(
	'get_block_templates',
	function ( $templates ) {
		foreach ( $templates as $template ) {
			$blocks            = parse_blocks( $template->content );
			$blocks            = gutenberg_replace_pattern_blocks( $blocks );
			$template->content = serialize_blocks( $blocks );
		}
		return $templates;
	}
);

add_filter(
	'get_block_template',
	function ( $template ) {
		$blocks            = parse_blocks( $template->content );
		$blocks            = gutenberg_replace_pattern_blocks( $blocks );
		$template->content = serialize_blocks( $blocks );
		return $template;
	}
);

add_filter(
	'rest_post_dispatch',
	function ( $result, $server, $request ) {
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
	},
	10,
	3
);
