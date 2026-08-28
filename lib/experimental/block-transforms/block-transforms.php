<?php
/**
 * Block transforms declared in `block.json`, and the conversions that read them.
 *
 * See https://github.com/WordPress/gutenberg/issues/13163.
 *
 * @package gutenberg
 */

/**
 * Passes a block type's `transforms` through to its server-side registration.
 *
 * `register_block_type_from_metadata()` copies a fixed list of `block.json`
 * fields onto the block type. This adds `transforms` to it for the WordPress
 * versions the plugin supports that do not copy the field themselves.
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
 * Sends the transforms block types declare to the editor.
 *
 * `get_block_editor_server_block_settings()` picks a fixed list of block type
 * fields and offers no filter, so the field travels in a bootstrap call of its
 * own. The block store keeps the definition it already has and takes only
 * `transforms` from a later call, which leaves everything core sent untouched
 * and makes this a no-op once core sends `transforms` itself.
 *
 * @return void
 */
function gutenberg_bootstrap_block_transforms() {
	$definitions = array();

	foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
		if ( ! empty( $block_type->transforms ) ) {
			$definitions[ $block_type->name ] = array( 'transforms' => $block_type->transforms );
		}
	}

	if ( empty( $definitions ) ) {
		return;
	}

	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( $definitions, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ');'
	);
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_bootstrap_block_transforms' );

/**
 * Reports which blocks a server-side conversion can produce.
 *
 * An importer about to run over a whole site can ask what it will get before
 * it starts, rather than converting everything and reading the wreckage.
 *
 * A block declines outright when its `save` rewrites the markup rather than
 * wrapping it, so no source can be reproduced. A block converts conditionally
 * when it can reproduce some shapes and not others: it declares the content it
 * is able to save, and markup carrying anything else is left alone.
 *
 * @return array {
 *     Blocks a raw conversion knows about, each list sorted by block name.
 *
 *     @type string[] $converts    Blocks it can produce from any markup it matches.
 *     @type string[] $conditional Blocks it produces only from markup they can save back.
 *     @type string[] $declines    Blocks it deliberately will not produce.
 * }
 */
function gutenberg_get_block_conversion_support() {
	$converts    = array();
	$conditional = array();
	$declines    = array();

	foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
		if ( empty( $block_type->transforms['from'] ) || ! is_array( $block_type->transforms['from'] ) ) {
			continue;
		}

		foreach ( $block_type->transforms['from'] as $transform ) {
			if ( ! isset( $transform['type'] ) || 'raw' !== $transform['type'] ) {
				continue;
			}

			$declared = isset( $transform['serverConversion'] ) ? $transform['serverConversion'] : true;

			if ( false === $declared ) {
				$declines[] = $block_type->name;
			} elseif ( is_array( $declared ) && isset( $declared['requires'] ) ) {
				$conditional[] = $block_type->name;
			} else {
				$converts[] = $block_type->name;
			}
		}
	}

	/*
	 * The Embed block is matched on the text of a paragraph rather than on a
	 * selector, so it declares no `raw` transform to read. See
	 * `Gutenberg_Embed_Transforms`.
	 */
	if ( WP_Block_Type_Registry::get_instance()->get_registered( Gutenberg_Embed_Transforms::BLOCK_NAME ) instanceof WP_Block_Type ) {
		$converts[] = Gutenberg_Embed_Transforms::BLOCK_NAME;
	}

	$converts    = array_values( array_unique( $converts ) );
	$conditional = array_values( array_unique( $conditional ) );
	$declines    = array_values( array_unique( $declines ) );

	sort( $converts );
	sort( $conditional );
	sort( $declines );

	return array(
		'converts'    => $converts,
		'conditional' => $conditional,
		'declines'    => $declines,
	);
}

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
 * Converts blocks to another block type using the transforms block types declare.
 *
 * The PHP counterpart of `switchToBlockType()` in `@wordpress/blocks`, limited to
 * transforms that can be written as data in `block.json`.
 *
 * A transform produces the target block's attributes, not its saved markup, which
 * only its JavaScript `save()` can generate. Conversion is refused for a target
 * that saves markup, and allowed for one that renders on the server.
 *
 * @param array[]|array $blocks      Parsed block array, or a list of them.
 * @param string        $target_name Name of the block type to convert to.
 * @return array[]|null Parsed block arrays, or null when no transform applies.
 */
function gutenberg_switch_block_type( $blocks, $target_name ) {
	return Gutenberg_Block_Transforms::switch_block_type( $blocks, $target_name );
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
