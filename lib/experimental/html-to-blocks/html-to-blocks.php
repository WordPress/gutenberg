<?php
/**
 * Block transforms declared in `block.json`, and HTML to block conversion in PHP.
 *
 * See https://github.com/WordPress/gutenberg/issues/13163.
 *
 * @package gutenberg
 */

/**
 * Passes a block type's `transforms` through to its server-side registration.
 *
 * `register_block_type_from_metadata()` copies a fixed list of `block.json`
 * fields onto the block type. Until `transforms` joins that list in core, copy
 * it across here.
 *
 * @param array $settings Block type settings.
 * @param array $metadata Raw `block.json` metadata.
 * @return array Filtered block type settings.
 */
function gutenberg_register_block_transforms_from_metadata( $settings, $metadata ) {
	if ( isset( $metadata['transforms'] ) && is_array( $metadata['transforms'] ) ) {
		$settings['transforms'] = $metadata['transforms'];
	}

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_register_block_transforms_from_metadata', 10, 2 );

/**
 * Converts HTML into blocks using the transforms registered block types declare.
 *
 * Blocks are matched against the `transforms.from` entries of type `raw` on
 * every registered block type, mirroring `rawHandler()` in the editor. Markup
 * no block claims is preserved in a Custom HTML block rather than guessed at.
 *
 * @param string $html HTML to convert.
 * @return array[] Parsed block arrays, in the shape returned by `parse_blocks()`.
 */
function gutenberg_html_to_blocks( $html ) {
	return Gutenberg_HTML_To_Blocks::convert( $html );
}

/**
 * Converts HTML into serialized block markup.
 *
 * @param string $html HTML to convert.
 * @return string Block markup, ready to store as post content.
 */
function gutenberg_html_to_block_markup( $html ) {
	return serialize_blocks( gutenberg_html_to_blocks( $html ) );
}

/**
 * Derives a block's attributes from markup.
 *
 * The server-side counterpart of `getBlockAttributes()` in `@wordpress/blocks`.
 *
 * @param string $block_name Block name.
 * @param string $html       Markup to read the attributes from.
 * @param array  $attributes Optional. Attributes already known from block delimiters.
 * @return array Attribute values, keyed by attribute name.
 */
function gutenberg_get_block_attributes_from_html( $block_name, $html, $attributes = array() ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );

	if ( ! $block_type instanceof WP_Block_Type ) {
		return array();
	}

	$root = Gutenberg_HTML_Element::from_html( $html );

	if ( null === $root ) {
		return array();
	}

	return Gutenberg_Block_Attributes_Parser::parse( $block_type, $root, $attributes );
}
