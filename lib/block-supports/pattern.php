<?php
/**
 * Pattern block support flag.
 *
 * @package gutenberg
 */

$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( $gutenberg_experiments && array_key_exists( 'gutenberg-patterns', $gutenberg_experiments ) ) {
	/**
	 * Adds `patternId` and `dynamicContent` items to the block's `usesContext`
	 * configuration.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 */
	function gutenberg_register_pattern_support( $block_type ) {
		$pattern_support = property_exists( $block_type, 'supports' ) ? _wp_array_get( $block_type->supports, array( '__experimentalPattern' ), false ) : false;

		if ( $pattern_support ) {
			if ( ! $block_type->uses_context ) {
				$block_type->uses_context = array();
			}

			if ( ! in_array( 'patternId', $block_type->uses_context, true ) ) {
				$block_type->uses_context[] = 'patternId';
			}

			if ( ! in_array( 'dynamicContent', $block_type->uses_context, true ) ) {
				$block_type->uses_context[] = 'dynamicContent';
			}
		}
	}

	/**
	 * Creates an HTML tag processor based off the block's content and selector
	 * for the pattern sourced attribute.
	 *
	 * @param string $block_content Block markup.
	 * @param string $selector      Attribute's CSS selector.
	 *
	 * @return WP_HTML_Tag_Processor HTML tag processor having matched on attribute's selector.
	 */
	function gutenberg_create_pattern_content_processor( $block_content, $selector ) {
		if ( ! $selector ) {
			return false;
		}

		$tags             = new WP_HTML_Tag_Processor( $block_content );
		$is_selector_list = strpos( $selector, ',' ) !== false;

		if ( ! $is_selector_list ) {
			// TODO: The retrieval via selector could do with some work.
			$found = $tags->next_tag( array( 'tag_name' => $selector ) );

			return $found ? $tags : null;
		}

		$found     = false;
		$selectors = explode( ',', $selector );

		foreach ( $selectors as $tag_selector ) {
			// TODO: The retrieval via selector could do with some work.
			$found = $tags->next_tag( array( 'tag_name' => $tag_selector ) );

			if ( $found ) {
				break;
			}

			// TODO: Revisit whether a bookmark can be used here. The need for
			// the bookmark to be on a found tag meant that you already needed
			// to have searched and found a tag which made the rest of this
			// search awkward. Perhaps we could wrap the block in a div and
			// create the processor from that content, bookmarking that outer
			// div if the current approach isn't performant.
			$tags = new WP_HTML_Tag_Processor( $block_content );
		}

		return $found ? $tags : null;
	}

	/**
	 * Renders pattern data into the final block markup for block's within
	 * partially synced patterns.
	 *
	 * @param string   $block_content  Block Content.
	 * @param array    $block          Block attributes.
	 * @param WP_Block $block_instance The block instance.
	 *
	 * @return string
	 */
	function gutenberg_render_block_pattern_data( $block_content, $block, $block_instance ) {
		$block_type = $block_instance->block_type;

		// If for some reason, the block type is not found, skip it.
		if ( null === $block_type ) {
			return $block_content;
		}

		// If the block does not have pattern support, skip it.
		if ( ! block_has_support( $block_type, array( '__experimentalPattern' ), false ) ) {
			return $block_content;
		}

		// If the block doesn't have an ID to retrieve pattern instance data from, skip it.
		$pattern_block_id = _wp_array_get( $block, array( 'attrs', 'metadata', 'id' ), false );
		if ( ! $pattern_block_id ) {
			return $block_content;
		}

		// If there is no dynamic content matching this block's ID, skip it.
		$dynamic_content = _wp_array_get( $block_instance->context, array( 'dynamicContent', $pattern_block_id ), false );
		if ( ! $dynamic_content ) {
			return $block_content;
		}

		$pattern_attributes = _wp_array_get( $block_type->supports, array( '__experimentalPattern' ), false );

		foreach ( $pattern_attributes as $pattern_attribute => $pattern_attribute_type ) {
			// Some attributes might not need to be used in the markup but are
			// linked to other attributes e.g. Image block's url and id attributes.
			// TODO: Update the markup to alter the classname etc if required for image's and IDs etc.
			if ( 'ignore' === $pattern_attribute_type ) {
				continue;
			}

			$pattern_attribute_value = _wp_array_get( $dynamic_content, array( $pattern_attribute ), false );

			if ( ! $pattern_attribute_value ) {
				continue;
			}

			$selector = _wp_array_get( $block_type->attributes, array( $pattern_attribute, 'selector' ), null );

			if ( ! $selector ) {
				continue;
			}

			$tags = gutenberg_create_pattern_content_processor( $block_content, $selector );

			if ( ! $tags ) {
				continue;
			}

			// Only inner html content and DOM attributes are currently processed.

			// Process content.
			if ( 'content' === $pattern_attribute_type ) {
				$tag_name     = $tags->get_tag();
				$markup       = "<$tag_name>$pattern_attribute_value</$tag_name>";
				$updated_tags = new WP_HTML_Tag_Processor( $markup );
				$updated_tags->next_tag();

				// Get all the attributes from the original block and add them to the new markup.
				$names = $tags->get_attribute_names_with_prefix( '' );
				foreach ( $names as $name ) {
					$updated_tags->set_attribute( $name, $tags->get_attribute( $name ) );
				}

				$block_content = $updated_tags->get_updated_html();
			}

			if ( 'attr' === $pattern_attribute_type ) {
				$tags->set_attribute( $block_type->attributes[ $pattern_attribute ]['attribute'], $pattern_attribute_value );
				$block_content = $tags->get_updated_html();
			}
		}

		return $block_content;
	}

	// Register the block support.
	WP_Block_Supports::get_instance()->register(
		'pattern',
		array(
			'register_attribute' => 'gutenberg_register_pattern_support',
		)
	);

	add_filter( 'render_block', 'gutenberg_render_block_pattern_data', 10, 3 );
}
