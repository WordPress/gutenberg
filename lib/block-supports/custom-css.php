<?php
/**
 * Custom CSS block support.
 *
 * @package gutenberg
 */

/**
 * Returns whether a style object contains custom CSS at any nesting level.
 *
 * @param mixed $style Block style attribute value.
 * @return bool Whether custom CSS is present.
 */
function gutenberg_style_has_custom_css( $style ) {
	if ( ! is_array( $style ) ) {
		return false;
	}

	if ( isset( $style['css'] ) && is_string( $style['css'] ) && '' !== trim( $style['css'] ) ) {
		return true;
	}

	foreach ( $style as $value ) {
		if ( gutenberg_style_has_custom_css( $value ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Removes custom CSS keys from a style object at every nesting level.
 *
 * @param mixed $style Block style attribute value.
 * @return mixed Style value with custom CSS removed.
 */
function gutenberg_strip_custom_css_from_style( $style ) {
	if ( ! is_array( $style ) ) {
		return $style;
	}

	unset( $style['css'] );

	foreach ( $style as $key => $value ) {
		if ( is_array( $value ) ) {
			$style[ $key ] = gutenberg_strip_custom_css_from_style( $value );
			if ( empty( $style[ $key ] ) ) {
				unset( $style[ $key ] );
			}
		}
	}

	return $style;
}

/**
 * Builds processed custom CSS rules for the default and viewport states.
 *
 * @param array  $style    Block style attribute.
 * @param string $selector CSS selector used to scope nested custom CSS.
 * @return string[] Processed CSS rule strings.
 */
function gutenberg_get_processed_custom_css_rules( $style, $selector ) {
	$css_rules = array();

	$append_processed_css = static function ( $css, $media_query = null ) use ( &$css_rules, $selector ) {
		if ( ! is_string( $css ) || '' === trim( $css ) ) {
			return;
		}

		// Validate CSS doesn't contain HTML markup (same validation as global styles REST API).
		if ( preg_match( '#</?\w+#', $css ) ) {
			return;
		}

		$processed_css = WP_Theme_JSON_Gutenberg::process_blocks_custom_css( $css, $selector );
		if ( empty( $processed_css ) ) {
			return;
		}

		$css_rules[] = $media_query
			? $media_query . '{' . $processed_css . '}'
			: $processed_css;
	};

	$append_processed_css( $style['css'] ?? null );

	$viewport_settings        = gutenberg_get_global_settings( array( 'viewport' ) );
	$responsive_media_queries = WP_Theme_JSON_Gutenberg::get_viewport_media_queries( $viewport_settings );

	foreach ( $responsive_media_queries as $breakpoint => $media_query ) {
		$viewport_css = null;
		if ( isset( $style[ $breakpoint ] ) && is_array( $style[ $breakpoint ] ) ) {
			$viewport_css = $style[ $breakpoint ]['css'] ?? null;
		}
		$append_processed_css( $viewport_css, $media_query );
	}

	return $css_rules;
}

/**
 * Render the custom CSS stylesheet and add class name to block as required.
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
	if ( ! gutenberg_style_has_custom_css( $style ) ) {
		return $parsed_block;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $parsed_block['blockName'] );
	if ( ! block_has_support( $block_type, 'customCSS', true ) ) {
		return $parsed_block;
	}

	// Generate a unique class name for this block instance.
	$class_name    = wp_unique_id_from_values( $parsed_block, 'wp-custom-css-' );
	$selector      = '.' . $class_name;
	$processed_css = implode( '', gutenberg_get_processed_custom_css_rules( $style, $selector ) );

	if ( empty( $processed_css ) ) {
		return $parsed_block;
	}

	$existing_class_name = $parsed_block['attrs']['className'] ?? null;
	$updated_class_name  = is_string( $existing_class_name )
		? "$existing_class_name $class_name"
		: $class_name;

	$parsed_block['attrs']['className'] = $updated_class_name;

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

	return $parsed_block;
}

/**
 * Enqueues the block custom CSS styles.
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
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string               Filtered block content.
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
 * Strips `style.css` attributes from all blocks in post content.
 *
 * Uses WP_Block_Parser::next_token() to scan block tokens and surgically
 * replace only the attribute JSON that changed — no parse_blocks() +
 * serialize_blocks() round-trip needed.
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

		if ( ! isset( $attrs['style'] ) || ! gutenberg_style_has_custom_css( $attrs['style'] ) ) {
			continue;
		}

		$stripped_style = gutenberg_strip_custom_css_from_style( $attrs['style'] );

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
 * @access private
 */
function gutenberg_custom_css_kses_init_filters() {
	add_filter( 'content_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
	add_filter( 'content_filtered_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
}

/**
 * Removes the filters that strip custom CSS from block content on save.
 * @access private
 */
function gutenberg_custom_css_remove_filters() {
	remove_filter( 'content_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
	remove_filter( 'content_filtered_save_pre', 'gutenberg_strip_custom_css_from_blocks', 8 );
}

/**
 * Registers the custom CSS content filters if the user does not have the edit_css capability.
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
