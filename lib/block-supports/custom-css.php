<?php
/**
 * Custom CSS block support.
 *
 * @package gutenberg
 */

/**
 * Collects the raw custom CSS strings defined for a block instance, across the
 * default state, pseudo-states (e.g. `:hover`), and viewport states (e.g.
 * `@mobile`), including combinations of the two.
 *
 * @since 7.1.0
 *
 * @param array  $style      The block's `style` attribute.
 * @param string $block_name Block name.
 * @return array[] List of entries, each with `css`, `pseudo` (string|null),
 *                 and `media_query` (string|null) keys.
 */
function gutenberg_get_custom_css_state_entries( $style, $block_name ) {
	$entries = array();
	if ( empty( $style ) || ! is_array( $style ) ) {
		return $entries;
	}

	$add_entry = function ( $css, $pseudo, $media_query ) use ( &$entries ) {
		if ( is_string( $css ) && '' !== trim( $css ) ) {
			$entries[] = array(
				'css'         => $css,
				'pseudo'      => $pseudo,
				'media_query' => $media_query,
			);
		}
	};

	$supported_pseudo_states = WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block_name ] ?? array();

	static $responsive_media_queries = null;
	if ( null === $responsive_media_queries ) {
		// Viewport settings are request-wide, not per-block; compute once and
		// reuse across every block instance rendered in the request.
		$responsive_media_queries = WP_Theme_JSON_Gutenberg::get_viewport_media_queries(
			gutenberg_get_global_settings( array( 'viewport' ) )
		);
	}

	$add_entry( $style['css'] ?? null, null, null );

	foreach ( $supported_pseudo_states as $pseudo_state ) {
		$pseudo_style = $style[ $pseudo_state ] ?? null;
		if ( ! is_array( $pseudo_style ) ) {
			continue;
		}
		$add_entry( $pseudo_style['css'] ?? null, $pseudo_state, null );
	}

	foreach ( $responsive_media_queries as $breakpoint => $media_query ) {
		$breakpoint_style = $style[ $breakpoint ] ?? null;
		if ( ! is_array( $breakpoint_style ) ) {
			continue;
		}

		$add_entry( $breakpoint_style['css'] ?? null, null, $media_query );

		foreach ( $supported_pseudo_states as $pseudo_state ) {
			$breakpoint_pseudo_style = $breakpoint_style[ $pseudo_state ] ?? null;
			if ( ! is_array( $breakpoint_pseudo_style ) ) {
				continue;
			}
			$add_entry( $breakpoint_pseudo_style['css'] ?? null, $pseudo_state, $media_query );
		}
	}

	return $entries;
}

/**
 * Render the custom CSS stylesheet and add class name to block as required.
 *
 * @since 7.0.0
 *
 * @param array $parsed_block The parsed block.
 * @return array The same parsed block with custom CSS class name added if appropriate.
 *
 * @phpstan-param array{
 *     blockName: string|null,
 *     attrs: array{
 *         className?: string,
 *         style?: array{
 *             css?: string,
 *             ...
 *         },
 *         ...
 *     },
 *     ...
 * } $parsed_block
 */
function gutenberg_render_custom_css_support_styles( $parsed_block ) {
	$style = $parsed_block['attrs']['style'] ?? null;
	if ( empty( $style ) || ! is_array( $style ) ) {
		return $parsed_block;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $parsed_block['blockName'] );
	if ( ! block_has_support( $block_type, 'customCSS', true ) ) {
		return $parsed_block;
	}

	$state_entries = gutenberg_get_custom_css_state_entries( $style, $parsed_block['blockName'] );
	if ( empty( $state_entries ) ) {
		return $parsed_block;
	}

	// Validate CSS doesn't contain HTML markup (same validation as global styles REST API).
	// A single invalid state invalidates all of the block's custom CSS.
	foreach ( $state_entries as $entry ) {
		if ( preg_match( '#</?\w+#', $entry['css'] ) ) {
			return $parsed_block;
		}
	}

	// Generate a unique class name for this block instance.
	$class_name          = wp_unique_id_from_values( $parsed_block, 'wp-custom-css-' );
	$existing_class_name = $parsed_block['attrs']['className'] ?? null;
	$updated_class_name  = is_string( $existing_class_name )
		? "$existing_class_name $class_name"
		: $class_name;

	$parsed_block['attrs']['className'] = $updated_class_name;

	// Process the custom CSS using the same method as global styles, for every state.
	$selector      = '.' . $class_name;
	$processed_css = '';
	foreach ( $state_entries as $entry ) {
		$entry_selector = null !== $entry['pseudo'] ? $selector . $entry['pseudo'] : $selector;
		$entry_css      = WP_Theme_JSON_Gutenberg::process_blocks_custom_css( $entry['css'], $entry_selector );

		if ( empty( $entry_css ) ) {
			continue;
		}

		$processed_css .= null !== $entry['media_query']
			? $entry['media_query'] . '{' . $entry_css . '}'
			: $entry_css;
	}

	if ( ! empty( $processed_css ) ) {
		/**
		 * Reuse one handle so identical custom CSS is enqueued only once via
		 * {@see wp_unique_id_from_values()}. Explicitly declare the `wp-block-library`
		 * dependency so `global-styles` is guaranteed to print after it, preventing
		 * block default styles from unintentionally overriding global styles.
		 */
		$handle = 'wp-block-custom-css';
		if ( ! wp_style_is( $handle, 'registered' ) ) {
			wp_register_style( $handle, false, array( 'wp-block-library', 'global-styles' ) );
		}
		$after_styles = wp_styles()->get_data( $handle, 'after' );
		if ( ! is_array( $after_styles ) ) {
			$after_styles = array();
		}
		if ( ! in_array( $processed_css, $after_styles, true ) ) {
			wp_add_inline_style( $handle, $processed_css );
		}
	}

	return $parsed_block;
}

/**
 * Enqueues the block custom CSS styles.
 *
 * @since 7.0.0
 */
function gutenberg_enqueue_block_custom_css() {
	wp_enqueue_style( 'wp-block-custom-css' );
}

/**
 * Applies the custom CSS class name to the block's rendered HTML.
 *
 * The class name is generated in {@see gutenberg_render_custom_css_support_styles()}
 * and stored in block attributes. This filter adds it to the actual markup.
 *
 * @since 7.0.0
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 *
 * @phpstan-param array{
 *     attrs: array{
 *         className?: string,
 *         ...
 *     },
 *     ...
 * } $block
 */
function gutenberg_render_custom_css_class_name( $block_content, $block ) {
	$class_name_attr   = $block['attrs']['className'] ?? null;
	$class_name_prefix = 'wp-custom-css-';
	if ( ! is_string( $class_name_attr ) || ! str_contains( $class_name_attr, $class_name_prefix ) ) {
		return $block_content;
	}

	// Parse out the 'wp-custom-css-*' class name added by gutenberg_render_custom_css_support_styles().
	$matched_class_name = null;
	$token_delimiter    = " \t\f\r\n";
	$class_token        = strtok( $class_name_attr, $token_delimiter );
	while ( false !== $class_token ) {
		if ( str_starts_with( $class_token, $class_name_prefix ) ) {
			$matched_class_name = $class_token;
			break;
		}
		$class_token = strtok( $token_delimiter );
	}
	if ( null === $matched_class_name ) {
		return $block_content;
	}

	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( $tags->next_tag() ) {
		$tags->add_class( 'has-custom-css' );
		$tags->add_class( $matched_class_name );
	}

	return $tags->get_updated_html();
}

// Remove core filters and action to avoid rendering duplicate custom CSS styles.
if ( function_exists( 'wp_render_custom_css_class_name' ) ) {
	remove_filter( 'render_block', 'wp_render_custom_css_class_name' );
}
if ( function_exists( 'wp_render_custom_css_support_styles' ) ) {
	remove_filter( 'render_block_data', 'wp_render_custom_css_support_styles' );
}
if ( function_exists( 'wp_enqueue_block_custom_css' ) ) {
	remove_action( 'wp_enqueue_scripts', 'wp_enqueue_block_custom_css' );
}

// Add Gutenberg filters and action.
add_filter( 'render_block', 'gutenberg_render_custom_css_class_name', 10, 2 );
add_filter( 'render_block_data', 'gutenberg_render_custom_css_support_styles', 10, 1 );
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_block_custom_css', 1 );

/**
 * Registers the style block attribute for block types that support it.
 *
 * @since 7.0.0
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_custom_css_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	$has_custom_css_support = block_has_support( $block_type, array( 'customCSS' ), true );

	if ( $has_custom_css_support ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Removes `css` keys from a block's `style` attribute, including any nested
 * under pseudo-state (`:hover`) or viewport-state (`@mobile`) sub-objects.
 *
 * @since 7.1.0
 *
 * @param array $style The block's `style` attribute.
 * @return array The style attribute with all `css` keys removed.
 */
function gutenberg_strip_custom_css_from_style_array( $style ) {
	if ( ! is_array( $style ) ) {
		return $style;
	}

	unset( $style['css'] );

	foreach ( $style as $key => $value ) {
		if ( is_array( $value ) && ( str_starts_with( $key, ':' ) || str_starts_with( $key, '@' ) ) ) {
			$nested_style = gutenberg_strip_custom_css_from_style_array( $value );
			if ( empty( $nested_style ) ) {
				unset( $style[ $key ] );
			} else {
				$style[ $key ] = $nested_style;
			}
		}
	}

	return $style;
}

/**
 * Strips `style.css` attributes from all blocks in post content.
 *
 * Uses WP_Block_Parser::next_token() to scan block tokens and surgically
 * replace only the attribute JSON that changed — no parse_blocks() +
 * serialize_blocks() round-trip needed.
 *
 * @since 7.0.0
 *
 * @param string $content Post content to filter, expected to be escaped with slashes.
 * @return string Filtered post content with block custom CSS removed.
 */
function gutenberg_strip_custom_css_from_blocks( $content ) {
	if ( ! has_blocks( $content ) ) {
		return $content;
	}

	$unslashed = stripslashes( $content );

	$parser           = new WP_Block_Parser();
	$parser->document = $unslashed;
	$parser->offset   = 0;
	$end              = strlen( $unslashed );
	$replacements     = array();

	while ( $parser->offset < $end ) {
		$next_token = $parser->next_token();
		list( $token_type, , $attrs, $start_offset, $token_length ) = $next_token;

		if ( 'no-more-tokens' === $token_type ) {
			break;
		}

		$parser->offset = $start_offset + $token_length;

		if ( 'block-opener' !== $token_type && 'void-block' !== $token_type ) {
			continue;
		}

		if ( ! isset( $attrs['style'] ) || ! is_array( $attrs['style'] ) ) {
			continue;
		}

		$stripped_style = gutenberg_strip_custom_css_from_style_array( $attrs['style'] );
		if ( $stripped_style === $attrs['style'] ) {
			continue;
		}

		// Remove css and clean up empty style.
		if ( empty( $stripped_style ) ) {
			unset( $attrs['style'] );
		} else {
			$attrs['style'] = $stripped_style;
		}

		// Locate the JSON portion within the token.
		$token_string   = substr( $unslashed, $start_offset, $token_length );
		$json_rel_start = strcspn( $token_string, '{' );
		$json_rel_end   = strrpos( $token_string, '}' );

		$json_start  = $start_offset + $json_rel_start;
		$json_length = $json_rel_end - $json_rel_start + 1;

		// Re-encode attributes. If attrs is now empty, remove JSON and trailing space.
		if ( empty( $attrs ) ) {
			// Remove the trailing space after JSON: `{"style":{"css":"x"}} ` → ``
			$replacements[] = array( $json_start, $json_length + 1, '' );
		} else {
			$replacements[] = array( $json_start, $json_length, serialize_block_attributes( $attrs ) );
		}
	}

	if ( empty( $replacements ) ) {
		return $content;
	}

	// Build the result by splicing replacements into the original string.
	$result = '';
	$was_at = 0;

	foreach ( $replacements as $replacement ) {
		list( $offset, $length, $new_json ) = $replacement;
		$result                            .= substr( $unslashed, $was_at, $offset - $was_at ) . $new_json;
		$was_at                             = $offset + $length;
	}

	if ( $was_at < $end ) {
		$result .= substr( $unslashed, $was_at );
	}

	return addslashes( $result );
}

/**
 * Adds the filters to strip custom CSS from block content on save.
 *
 * @since 7.0.0
 * @access private
 */
function gutenberg_custom_css_kses_init_filters() {
	add_filter( 'content_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
	add_filter( 'content_filtered_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
}

/**
 * Removes the filters that strip custom CSS from block content on save.
 *
 * @since 7.0.0
 * @access private
 */
function gutenberg_custom_css_remove_filters() {
	remove_filter( 'content_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
	remove_filter( 'content_filtered_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
}

/**
 * Registers the custom CSS content filters if the user does not have the edit_css capability.
 *
 * @since 7.0.0
 * @access private
 */
function gutenberg_custom_css_kses_init() {
	gutenberg_custom_css_remove_filters();
	if ( ! current_user_can( 'edit_css' ) ) {
		gutenberg_custom_css_kses_init_filters();
	}
}

/**
 * Initializes custom CSS content filters when imported data should be filtered.
 *
 * This filter is the last being executed on force_filtered_html_on_import.
 * If the input of the filter is true it means we are in an import situation and should
 * enable the custom CSS filters, independently of the user capabilities.
 *
 * @since 7.0.0
 * @access private
 *
 * @param mixed $arg Input argument of the filter.
 * @return mixed Input argument of the filter.
 */
function gutenberg_custom_css_force_filtered_html_on_import_filter( $arg ) {
	if ( $arg ) {
		gutenberg_custom_css_kses_init_filters();
	}
	return $arg;
}

add_action( 'init', 'gutenberg_custom_css_kses_init', 20 );
add_action( 'set_current_user', 'gutenberg_custom_css_kses_init' );
add_filter( 'force_filtered_html_on_import', 'gutenberg_custom_css_force_filtered_html_on_import_filter', 999 );

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'custom-css',
	array(
		'register_attribute' => 'gutenberg_register_custom_css_support',
	)
);
