<?php

function replace_pattern_blocks( $blocks, &$inner_content = null ) {
	$i = 0;
	// Also process new blocks that are inserted.
	while ( $i < count( $blocks ) ) {
		if ( 'core/pattern' === $blocks[ $i ]['blockName'] ) {
			$registry = WP_Block_Patterns_Registry::get_instance();
			$pattern = $registry->get_registered( $blocks[ $i ]['attrs']['slug'] );
			$pattern_content = $pattern['content'];
			$blocks_to_insert = parse_blocks( $pattern_content );
			array_splice( $blocks, $i, 1, $blocks_to_insert );

			if ( $inner_content ) {
				$nullIndices = array_keys( $inner_content, null, true );
				$content_index = $nullIndices[ $i ];
				$nulls = array_fill( 0, count( $blocks_to_insert ), null );
				array_splice( $inner_content, $content_index, 1, $nulls );
			}
		} else if ( ! empty( $blocks[ $i ]['innerBlocks'] ) ) {
			$blocks[ $i ]['innerBlocks'] = replace_pattern_blocks(
				$blocks[ $i ]['innerBlocks'],
				$blocks[ $i ]['innerContent']
			);
		}
		$i++;
	}
	return $blocks;
}

add_filter(
	'get_block_templates',
	/**
	 * Resolves all pattern blocks in the template content.
	 *
	 * @param WP_Block_Template[] $query_result Array of found block templates.
	 */
	function( $templates ) {
		foreach ( $templates as $template ) {
			$blocks = parse_blocks( $template->content );
			$blocks = replace_pattern_blocks( $blocks );
			$template->content = serialize_blocks( $blocks );
		}
		return $templates;
	}
);

