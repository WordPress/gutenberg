<?php
/**
 * Block bindings additions for WordPress 7.3.
 *
 * @since 7.3.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

// The following filter can be removed once the minimum required WordPress version is 7.3 or newer.
add_filter(
	'block_bindings_supported_attributes_core/accordion-heading',
	function ( $supported_attributes ) {
		if ( ! in_array( 'title', $supported_attributes, true ) ) {
			$supported_attributes[] = 'title';
		}
		return $supported_attributes;
	}
);

/**
 * Returns the HTML allowed in a bound Accordion Heading title.
 *
 * The title is rendered inside a `<button>`, which may only contain inline,
 * non-interactive content. The block editor matches this by turning off links
 * and line breaks in the title, so a bound value is limited to the same inline
 * formatting. Other tags, such as links and paragraphs, are removed and their
 * text is kept.
 *
 * @since 7.3.0
 *
 * @return array Allowed HTML tags and attributes, in the format `wp_kses()` expects.
 */
function gutenberg_get_accordion_heading_title_allowed_html() {
	$inline_tags  = array( 'abbr', 'b', 'bdo', 'cite', 'code', 'del', 'em', 'i', 'img', 'ins', 'kbd', 'mark', 'q', 's', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'u' );
	$allowed_html = array_intersect_key( wp_kses_allowed_html( 'post' ), array_flip( $inline_tags ) );

	// Focus, roles and Interactivity API directives would make the content interactive.
	foreach ( array_keys( $allowed_html ) as $tag ) {
		unset( $allowed_html[ $tag ]['tabindex'], $allowed_html[ $tag ]['role'], $allowed_html[ $tag ]['data-*'] );
	}

	// An image map would make the image interactive.
	unset( $allowed_html['img']['usemap'] );

	return $allowed_html;
}

/**
 * Renders the bound title of an Accordion Heading block.
 *
 * `WP_Block::replace_html()` only matches attribute selectors by tag name, so
 * it can't find the `.wp-block-accordion-heading__toggle-title` element and the
 * saved title is rendered instead of the bound value. Core still merges the
 * bound value into the block attributes, so it is written into the title
 * element here, limited to the inline formatting a button can contain.
 *
 * This keeps working if Core starts matching class selectors, because the
 * value Core writes is replaced again here. It can be removed once
 * `WP_Block::replace_html()` supports class selectors and limits the title
 * to inline formatting.
 *
 * @since 7.3.0
 *
 * @param string   $block_content The rendered block content.
 * @param array    $parsed_block  The parsed block.
 * @param WP_Block $instance      The block instance.
 * @return string The block content with the bound title.
 */
function gutenberg_render_block_accordion_heading_title_binding( $block_content, $parsed_block, $instance ) {
	if ( ! $instance instanceof WP_Block ) {
		return $block_content;
	}

	// Includes bindings expanded from `__default`. A `null` value leaves `title` unset.
	$attributes = $instance->attributes;
	if ( ! isset( $attributes['metadata']['bindings']['title'] ) || ! isset( $attributes['title'] ) ) {
		return $block_content;
	}

	$title = $attributes['title'];
	if ( ! is_string( $title ) && ! is_int( $title ) && ! is_float( $title ) ) {
		return $block_content;
	}

	// A `title` saved in the block comment is not a bound value.
	if ( isset( $parsed_block['attrs']['title'] ) && $parsed_block['attrs']['title'] === $title ) {
		return $block_content;
	}

	// Mirrors `WP_Block::get_block_bindings_processor()`.
	// phpcs:disable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration -- Class methods, not global functions.
	$processor_class = new class( '', WP_HTML_Processor::CONSTRUCTOR_UNLOCK_CODE ) extends WP_HTML_Processor {
		/**
		 * Replaces the content between the current tag opener and its matching closer.
		 *
		 * @param string $rich_text The rich text to replace the original content with.
		 * @return bool Whether the content was replaced.
		 */
		public function replace_rich_text( $rich_text ) {
			if ( $this->is_tag_closer() || ! $this->expects_closer() ) {
				return false;
			}

			$depth    = $this->get_current_depth();
			$tag_name = $this->get_tag();

			$this->set_bookmark( '_gutenberg_block_bindings' );
			// Bookmark keys get an extra `_` prefix.
			$tag_opener = $this->bookmarks['__gutenberg_block_bindings'];
			$start      = $tag_opener->start + $tag_opener->length;

			// Find the matching tag closer.
			while ( $this->next_token() && $this->get_current_depth() >= $depth ) {
			}

			if ( ! $this->is_tag_closer() || $tag_name !== $this->get_tag() ) {
				return false;
			}

			$this->set_bookmark( '_gutenberg_block_bindings' );
			$tag_closer = $this->bookmarks['__gutenberg_block_bindings'];

			$this->lexical_updates[] = new WP_HTML_Text_Replacement(
				$start,
				$tag_closer->start - $start,
				$rich_text
			);

			return true;
		}
	};
	// phpcs:enable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration

	$processor = $processor_class::create_fragment( $block_content );
	if ( null === $processor ) {
		return $block_content;
	}

	if ( ! $processor->next_tag( array( 'class_name' => 'wp-block-accordion-heading__toggle-title' ) ) ) {
		return $block_content;
	}

	if ( ! $processor->replace_rich_text( wp_kses( (string) $title, gutenberg_get_accordion_heading_title_allowed_html() ) ) ) {
		return $block_content;
	}

	return $processor->get_updated_html();
}
add_filter( 'render_block_core/accordion-heading', 'gutenberg_render_block_accordion_heading_title_binding', 10, 3 );
