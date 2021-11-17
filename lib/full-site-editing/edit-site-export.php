<?php
/**
 * REST endpoint for exporting the contents of the Edit Site Page editor.
 *
 * @package gutenberg
 */

/**
 * Parses wp_template content and removes the theme attribute from
 * each wp_template_part
 *
 * @param string $template_content serialized wp_template content.
 *
 * @return string Updated wp_template content.
 */
function _remove_theme_attribute_from_content( $template_content ) {
	$has_updated_content = false;
	$new_content         = '';
	$template_blocks     = parse_blocks( $template_content );

	$blocks = _flatten_blocks( $template_blocks );
	foreach ( $blocks as $key => $block ) {
		if ( 'core/template-part' === $block['blockName'] && isset( $block['attrs']['theme'] ) ) {
			unset( $blocks[ $key ]['attrs']['theme'] );
			$has_updated_content = true;
		}
	}

	if ( $has_updated_content ) {
		foreach ( $template_blocks as $block ) {
			$new_content .= serialize_block( $block );
		}

		return $new_content;
	}

	return $template_content;
}
