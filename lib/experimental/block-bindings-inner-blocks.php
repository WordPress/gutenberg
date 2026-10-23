<?php
/**
 * Inner blocks bindings: a block bindings source supplies the inner blocks of a
 * Group or Column block through `metadata.bindings.innerBlocks`.
 *
 * For the `innerBlocks` key, a source returns serialized block markup, which
 * replaces the inner blocks of the block. An empty string leaves the block
 * without inner blocks, and any other value keeps its own.
 *
 * Core resolves the binding like the binding of an attribute, in
 * `WP_Block::process_block_bindings()`, which runs once the block has its final
 * context and before its inner blocks render. The inner blocks of the instance
 * are replaced there, and the value never becomes an attribute. In Core, this
 * belongs in `WP_Block::render()`.
 *
 * @package gutenberg
 */

/**
 * Returns the block types whose inner blocks a block bindings source can
 * supply.
 *
 * The markup they save wraps their inner blocks in a single element, so the
 * inner blocks of a source have a known place.
 *
 * @return string[] The block type names.
 */
function gutenberg_block_bindings_get_inner_blocks_hosts() {
	return array( 'core/group', 'core/column' );
}

/**
 * Adds `innerBlocks` to the attributes that block bindings support on the Group
 * and Column blocks.
 *
 * Another filter can return something other than an array, such as null, which
 * Core takes for no supported attributes: it is returned as it is.
 *
 * @param string[]|mixed $supported_attributes The attributes supported by block bindings.
 * @param string         $block_type           The block type name.
 * @return string[]|mixed The supported attributes.
 */
function gutenberg_block_bindings_add_inner_blocks_support( $supported_attributes, $block_type ) {
	if ( ! is_array( $supported_attributes ) ) {
		return $supported_attributes;
	}
	if (
		in_array( $block_type, gutenberg_block_bindings_get_inner_blocks_hosts(), true ) &&
		! in_array( 'innerBlocks', $supported_attributes, true )
	) {
		$supported_attributes[] = 'innerBlocks';
	}
	return $supported_attributes;
}
add_filter( 'block_bindings_supported_attributes', 'gutenberg_block_bindings_add_inner_blocks_support', 10, 2 );

/**
 * Removes `innerBlocks` from the attributes that block bindings support on every
 * other block type, as their markup has no known place for inner blocks.
 *
 * Like the filter above, it returns anything other than an array as it is.
 *
 * @param string[]|mixed $supported_attributes The attributes supported by block bindings.
 * @param string         $block_type           The block type name.
 * @return string[]|mixed The supported attributes.
 */
function gutenberg_block_bindings_restrict_inner_blocks_support( $supported_attributes, $block_type ) {
	if (
		! is_array( $supported_attributes ) ||
		in_array( $block_type, gutenberg_block_bindings_get_inner_blocks_hosts(), true ) ||
		! in_array( 'innerBlocks', $supported_attributes, true )
	) {
		return $supported_attributes;
	}
	// Keep a list, so that the editor settings encode it as an array.
	return array_values( array_diff( $supported_attributes, array( 'innerBlocks' ) ) );
}
add_filter( 'block_bindings_supported_attributes', 'gutenberg_block_bindings_restrict_inner_blocks_support', PHP_INT_MAX, 2 );

/**
 * Removes `innerBlocks` from the attributes that the editor settings list as
 * supported by block bindings on other block types than Group and Column, which
 * the filters for a single block type can add after the one above.
 *
 * The editor binds inner blocks only where the server can render them.
 *
 * @param array $settings The block editor settings.
 * @return array The block editor settings.
 */
function gutenberg_block_bindings_restrict_inner_blocks_editor_settings( $settings ) {
	if ( empty( $settings['__experimentalBlockBindingsSupportedAttributes'] ) || ! is_array( $settings['__experimentalBlockBindingsSupportedAttributes'] ) ) {
		return $settings;
	}
	foreach ( $settings['__experimentalBlockBindingsSupportedAttributes'] as $block_type => $supported_attributes ) {
		$supported_attributes = gutenberg_block_bindings_restrict_inner_blocks_support( (array) $supported_attributes, $block_type );
		if ( empty( $supported_attributes ) ) {
			// Like Core, which lists only block types with supported attributes.
			unset( $settings['__experimentalBlockBindingsSupportedAttributes'][ $block_type ] );
		} else {
			$settings['__experimentalBlockBindingsSupportedAttributes'][ $block_type ] = $supported_attributes;
		}
	}
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_block_bindings_restrict_inner_blocks_editor_settings', PHP_INT_MAX );

/**
 * Returns whether a text is made of HTML whitespace only.
 *
 * @param string $text The text.
 * @return bool Whether the text is made of whitespace only.
 */
function gutenberg_block_bindings_is_html_whitespace( $text ) {
	return strspn( $text, " \t\n\f\r" ) === strlen( $text );
}

/**
 * Returns whether the value of an `innerBlocks` binding supplies inner blocks.
 *
 * Block markup does, and so does an empty string, which supplies none. Any
 * other value leaves the block with its own inner blocks.
 *
 * @param mixed $value The value of the source.
 * @return bool Whether the value supplies inner blocks.
 */
function gutenberg_block_bindings_is_inner_blocks_value( $value ) {
	return '' === $value || (
		is_string( $value ) &&
		'<!-- wp:' === substr( $value, strspn( $value, " \t\n\f\r" ), 8 )
	);
}

/**
 * Returns the state the inner blocks bindings filters share in a request.
 *
 * - `frames`: the substitutions being rendered, outermost first, each with a
 *   weak reference to the block instance and a key made of the source and the
 *   value.
 * - `bytes`: the length of the values substituted since `frames` was last empty.
 * - `parsed`: the blocks of the values parsed last, keyed by the value.
 *
 * @param bool $reset Optional. Whether to start over, as tests do. Default false.
 * @return stdClass The state.
 */
function gutenberg_block_bindings_get_inner_blocks_state( $reset = false ) {
	static $state = null;
	if ( null === $state || $reset ) {
		$state = (object) array(
			'frames' => array(),
			'bytes'  => 0,
			'parsed' => array(),
		);
	}
	return $state;
}

/**
 * Sanitizes and parses the block markup a source supplies as inner blocks.
 *
 * The markup never goes through the filters that sanitize post content when it
 * is saved, so it is sanitized here, as Core does for the value of a rich text
 * binding. Embeds are then expanded, as `the_content` does for post content
 * before its blocks render.
 *
 * @global WP_Embed $wp_embed WordPress Embed object.
 *
 * @param string $value Serialized block markup.
 * @return array[] The parsed blocks, without the whitespace between them.
 */
function gutenberg_block_bindings_parse_inner_blocks_value( $value ) {
	global $wp_embed;

	$state = gutenberg_block_bindings_get_inner_blocks_state();
	if ( isset( $state->parsed[ $value ] ) ) {
		return $state->parsed[ $value ];
	}

	$markup = wp_kses_post( $value );
	if ( $wp_embed instanceof WP_Embed ) {
		$markup = $wp_embed->run_shortcode( $markup );
		$markup = $wp_embed->autoembed( $markup );
	}

	$blocks = array();
	foreach ( parse_blocks( $markup ) as $block ) {
		if ( null === $block['blockName'] && gutenberg_block_bindings_is_html_whitespace( $block['innerHTML'] ) ) {
			continue;
		}
		$blocks[] = $block;
	}

	// A request can render any number of values, so only the last ones are kept.
	if ( count( $state->parsed ) >= 16 ) {
		unset( $state->parsed[ array_key_first( $state->parsed ) ] );
	}
	$state->parsed[ $value ] = $blocks;

	return $blocks;
}

/**
 * Returns where inner blocks go in the markup of a block that has none.
 *
 * They go before the closer of the only element of the markup, when that
 * element is empty and its tag can hold the inner blocks of a Group or Column.
 * Anything but whitespace around it leaves no unambiguous place for them.
 *
 * @param string $html The markup of the block.
 * @return int|null The byte offset of the closer, or null when there is no place for the inner blocks.
 */
function gutenberg_block_bindings_get_inner_blocks_offset( $html ) {
	/*
	 * The HTML API keeps the byte offsets of tokens to itself, so a subclass
	 * reads the one of the closer from a bookmark. The redeclaration-guard
	 * sniff cannot tell the method of an anonymous class from a function.
	 */
	// phpcs:disable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	$processor = new class( $html ) extends WP_HTML_Tag_Processor {
		/**
		 * Returns the byte offset of the closer of the only element in the markup.
		 *
		 * @return int|null The byte offset, or null when the markup is anything
		 *                  but a single empty element with an allowed tag.
		 */
		public function get_root_closer_offset() {
			$root_tags = array( 'DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'UL', 'OL', 'FIGURE' );
			$root      = null;
			$offset    = null;

			while ( $this->next_token() ) {
				$type = $this->get_token_type();
				if ( '#text' === $type && gutenberg_block_bindings_is_html_whitespace( $this->get_modifiable_text() ) ) {
					continue;
				}

				if ( '#tag' !== $type || null !== $offset ) {
					return null;
				}

				if ( null === $root ) {
					if ( $this->is_tag_closer() || $this->has_self_closing_flag() || ! in_array( $this->get_tag(), $root_tags, true ) ) {
						return null;
					}
					$root = $this->get_tag();
					continue;
				}

				if ( ! $this->is_tag_closer() || $root !== $this->get_tag() ) {
					return null;
				}
				$this->set_bookmark( 'closer' );
				$offset = $this->bookmarks['closer']->start;
			}

			return $this->paused_at_incomplete_token() ? null : $offset;
		}
	};
	// phpcs:enable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration

	return $processor->get_root_closer_offset();
}

/**
 * Returns the inner content of a block once its inner blocks are replaced.
 *
 * The new inner blocks take the place of the run of its own inner blocks,
 * which may only be separated by whitespace. A block without markup of its own
 * is all inner blocks, and an empty element holds them before its closer.
 *
 * @param array $inner_content The inner content of the block.
 * @param int   $count         The number of new inner blocks.
 * @return array|null The inner content, or null when there is no unambiguous place for the inner blocks.
 */
function gutenberg_block_bindings_get_bound_inner_content( $inner_content, $count ) {
	$inner_content = array_values( $inner_content );
	$markup        = array_values( array_filter( $inner_content, 'is_string' ) );

	if ( 0 === $count ) {
		return $markup;
	}

	$first = null;
	$last  = null;
	foreach ( $inner_content as $index => $chunk ) {
		if ( ! is_string( $chunk ) ) {
			$first = $first ?? $index;
			$last  = $index;
		}
	}

	if ( null !== $first ) {
		foreach ( array_slice( $inner_content, $first, $last - $first ) as $chunk ) {
			if ( is_string( $chunk ) && ! gutenberg_block_bindings_is_html_whitespace( $chunk ) ) {
				return null;
			}
		}
		return array_merge(
			array_slice( $inner_content, 0, $first ),
			array_fill( 0, $count, null ),
			array_slice( $inner_content, $last + 1 )
		);
	}

	if ( empty( $markup ) ) {
		return array_fill( 0, $count, null );
	}

	$html   = implode( '', $markup );
	$offset = gutenberg_block_bindings_get_inner_blocks_offset( $html );
	if ( null === $offset ) {
		return null;
	}
	return array_merge(
		array( substr( $html, 0, $offset ) ),
		array_fill( 0, $count, null ),
		array( substr( $html, $offset ) )
	);
}

/**
 * Replaces the inner blocks of a block with the ones its `innerBlocks` binding
 * supplies, before the block renders them.
 *
 * Runs last on the value `WP_Block::process_block_bindings()` resolves, and
 * returns null for `innerBlocks` so that the value never becomes an attribute.
 * The block keeps its own inner blocks unless all of these hold:
 *
 * - It is a Group or Column block, and its own metadata binds `innerBlocks` to
 *   the source: a `__default` binding never binds inner blocks.
 * - The source is not one that supplies single values from post meta, post
 *   data or term data.
 * - The block has every context the source uses.
 * - The value is block markup, or an empty string for no inner blocks.
 * - No ancestor renders the same value from the same source, fewer than 8 do
 *   any, and they have rendered less than 1 MB of values so far.
 * - The markup of the block has an unambiguous place for the inner blocks.
 *
 * A substituted block counts as an ancestor until it has rendered. When its
 * rendering throws, or its binding is resolved outside `WP_Block::render()`, it
 * counts until it is gone or a substituted block around it has rendered: a
 * caller that keeps it after resolving its binding keeps it counting, which is
 * accepted.
 *
 * Every value is sanitized, whatever its source, as the user who supplied it
 * may not be allowed to publish unfiltered HTML.
 *
 * @param mixed    $value          The value of the source.
 * @param string   $source_name    The name of the source.
 * @param array    $source_args    The arguments of the binding.
 * @param WP_Block $block_instance The block instance.
 * @param string   $attribute_name The name of the bound attribute.
 * @return mixed The value, or null for `innerBlocks`.
 */
function gutenberg_block_bindings_replace_inner_blocks( $value, $source_name, $source_args, $block_instance, $attribute_name ) {
	if ( 'innerBlocks' !== $attribute_name ) {
		return $value;
	}

	if (
		! $block_instance instanceof WP_Block ||
		! in_array( $block_instance->name, gutenberg_block_bindings_get_inner_blocks_hosts(), true ) ||
		in_array( $source_name, array( 'core/post-meta', 'core/post-data', 'core/term-data' ), true ) ||
		! gutenberg_block_bindings_is_inner_blocks_value( $value )
	) {
		return null;
	}

	$binding = $block_instance->parsed_block['attrs']['metadata']['bindings']['innerBlocks'] ?? null;
	if ( ! is_array( $binding ) || ( $binding['source'] ?? null ) !== $source_name ) {
		return null;
	}

	$source = get_block_bindings_source( $source_name );
	if ( null === $source ) {
		return null;
	}
	foreach ( (array) $source->uses_context as $context_name ) {
		if ( ! array_key_exists( $context_name, $block_instance->context ) ) {
			return null;
		}
	}

	$state = gutenberg_block_bindings_get_inner_blocks_state();
	// Blocks that are gone without having finished rendering left their frames.
	while ( $state->frames && null === end( $state->frames )['block']->get() ) {
		array_pop( $state->frames );
	}
	if ( empty( $state->frames ) ) {
		$state->bytes = 0;
	}
	$key = $source_name . ':' . md5( $value );
	if (
		count( $state->frames ) >= 8 ||
		$state->bytes >= MB_IN_BYTES ||
		in_array( $key, array_column( $state->frames, 'key' ), true )
	) {
		return null;
	}

	$inner_content = $block_instance->parsed_block['innerContent'] ?? array();
	if ( ! is_array( $inner_content ) ) {
		return null;
	}
	$blocks        = '' === $value ? array() : gutenberg_block_bindings_parse_inner_blocks_value( $value );
	$inner_content = gutenberg_block_bindings_get_bound_inner_content( $inner_content, count( $blocks ) );
	if ( null === $inner_content ) {
		return null;
	}

	$block_instance->parsed_block['innerBlocks']  = $blocks;
	$block_instance->parsed_block['innerContent'] = $inner_content;
	$block_instance->parsed_block['innerHTML']    = implode( '', array_filter( $inner_content, 'is_string' ) );
	$block_instance->refresh_parsed_block_dependents();

	// The refresh keeps the previous inner blocks and markup when the new ones are empty.
	if ( empty( $blocks ) ) {
		$block_instance->inner_blocks = array();
	}
	$block_instance->inner_html    = $block_instance->parsed_block['innerHTML'];
	$block_instance->inner_content = $inner_content;

	$state->frames[] = array(
		'block' => WeakReference::create( $block_instance ),
		'key'   => $key,
	);
	$state->bytes   += strlen( $value );

	return null;
}
add_filter( 'block_bindings_source_value', 'gutenberg_block_bindings_replace_inner_blocks', PHP_INT_MAX, 5 );

/**
 * Ends the substitution of the inner blocks of a block once it has rendered.
 *
 * Any substitution that began after it ends too: it was left by an inner block
 * whose rendering threw an exception that was caught inside the block, or whose
 * binding was resolved outside its rendering.
 *
 * @param string        $block_content The block content.
 * @param array         $parsed_block  The full block.
 * @param WP_Block|null $instance      The block instance.
 * @return string The block content.
 */
function gutenberg_block_bindings_end_inner_blocks_substitution( $block_content, $parsed_block, $instance = null ) {
	if ( ! $instance instanceof WP_Block ) {
		return $block_content;
	}
	$state = gutenberg_block_bindings_get_inner_blocks_state();
	for ( $index = count( $state->frames ) - 1; $index >= 0; $index-- ) {
		if ( $state->frames[ $index ]['block']->get() === $instance ) {
			array_splice( $state->frames, $index );
			break;
		}
	}
	return $block_content;
}
add_filter( 'render_block', 'gutenberg_block_bindings_end_inner_blocks_substitution', PHP_INT_MAX, 3 );
