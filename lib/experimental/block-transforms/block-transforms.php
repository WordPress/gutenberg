<?php
/**
 * Server-side conversions reading the block transforms declared in `block.json`.
 *
 * Getting the `transforms` field itself onto `WP_Block_Type`, to the editor and
 * onto the REST API is a WordPress 7.2 change, backported in
 * `lib/compat/wordpress-7.2/block-type-transforms.php`.
 *
 * See https://github.com/WordPress/gutenberg/issues/13163.
 *
 * @package gutenberg
 */

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
 * The result is not sanitized. A block's content is reduced to what its
 * transform's schema allows, as a paste is, which drops an `onclick` along
 * the way; but a `javascript:` URL the schema keeps is kept, and a `<script>`
 * no block claims is kept whole in a Custom HTML block. Content from a source
 * that is not trusted, or converted on behalf of a user without
 * `unfiltered_html`, needs the filtering a save applies: `wp_insert_post()`
 * runs it for the current user, and `wp_kses_post()` does the same where
 * there is none, as in a WP-CLI command or a cron job.
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
 * The markup is not sanitized; see `gutenberg_html_to_blocks()` for what the
 * caller owes it before storing it.
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
 * Attribute values read from the source blocks travel as they are; nothing is
 * sanitized here, as `gutenberg_html_to_blocks()` describes.
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
