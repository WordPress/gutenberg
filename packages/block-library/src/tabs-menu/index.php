<?php
/**
 * Tabs Menu Block
 *
 * @package WordPress
 */

/**
 * Build inline CSS custom properties for active/hover color settings.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Inline CSS string.
 */
function block_core_tabs_menu_generate_color_styles( array $attributes ): string {
	$active_bg   = $attributes['customActiveBackgroundColor'] ?? '';
	$active_text = $attributes['customActiveTextColor'] ?? '';
	$hover_bg    = $attributes['customHoverBackgroundColor'] ?? '';
	$hover_text  = $attributes['customHoverTextColor'] ?? '';

	// Extract base colors from core color supports (background/text)
	// Check custom colors first (style.color.background/text), then preset colors (backgroundColor/textColor)
	$base_bg   = $attributes['style']['color']['background'] ?? '';
	$base_text = $attributes['style']['color']['text'] ?? '';

	// Handle preset colors (these are slugs that need to be converted to CSS custom properties)
	if ( empty( $base_bg ) && ! empty( $attributes['backgroundColor'] ) ) {
		$base_bg = "var(--wp--preset--color--{$attributes['backgroundColor']})";
	}
	if ( empty( $base_text ) && ! empty( $attributes['textColor'] ) ) {
		$base_text = "var(--wp--preset--color--{$attributes['textColor']})";
	}

	$styles = array();

	// Only include non-empty values to preserve CSS fallback defaults
	if ( ! empty( $base_bg ) ) {
		$styles['--tab-bg'] = $base_bg;
	}
	if ( ! empty( $base_text ) ) {
		$styles['--tab-text'] = $base_text;
	}
	if ( ! empty( $active_bg ) ) {
		$styles['--custom-tab-active-color'] = $active_bg;
	}
	if ( ! empty( $active_text ) ) {
		$styles['--custom-tab-active-text-color'] = $active_text;
	}
	if ( ! empty( $hover_bg ) ) {
		$styles['--custom-tab-hover-color'] = $hover_bg;
	}
	if ( ! empty( $hover_text ) ) {
		$styles['--custom-tab-hover-text-color'] = $hover_text;
	}

	$style_string = array_map(
		static function ( string $key, string $value ): string {
			return $key . ': ' . $value . ';';
		},
		array_keys( $styles ),
		$styles
	);

	return implode( ' ', array_filter( $style_string ) );
}

/**
 * Build inline CSS custom properties for border settings.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Inline CSS string.
 */
function block_core_tabs_menu_generate_border_styles( array $attributes ): string {
	$radius = $attributes['style']['border']['radius'] ?? null;

	if ( empty( $radius ) ) {
		return '';
	}

	if ( is_array( $radius ) ) {
		$radius_value = wp_sprintf(
			'%s %s %s %s',
			$radius['topLeft'] ?? '0',
			$radius['topRight'] ?? '0',
			$radius['bottomRight'] ?? '0',
			$radius['bottomLeft'] ?? '0'
		);
	} else {
		$radius_value = $radius;
	}

	return wp_sprintf( '--tab-border-radius: %s;', (string) $radius_value );
}

/**
 * Render callback for core/tabs-menu.
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content.
 * @param \WP_Block $block      WP_Block instance.
 *
 * @return string Updated HTML.
 */
function block_core_tabs_menu_render_callback( array $attributes, string $content, \WP_Block $block ): string {
	$tabs_list = $block->context['core/tabs-list'] ?? array();

	if ( empty( $tabs_list ) ) {
		return '';
	}

	// Extract template element from saved content (the hidden <a> with tabs__tab-template class)
	preg_match(
		'/<a[^>]*class="[^"]*tabs__tab-template[^"]*"[^>]*>/i',
		$content,
		$template_matches
	);
	$template = $template_matches[0] ?? '<a class="tabs__tab-label">';

	// Remove the template marker class and hidden attribute from the extracted template
	$template = preg_replace( '/\s*tabs__tab-template/', '', $template );
	$template = preg_replace( '/\s*hidden(?:="[^"]*")?/', '', $template );

	// Build tabs from template
	$tabs_markup = '';
	foreach ( $tabs_list as $tab ) {
		$tab_id    = esc_attr( $tab['id'] ?? '' );
		$tab_label = esc_html( $tab['label'] ?? '' );

		if ( empty( $tab_id ) ) {
			continue;
		}

		// Clone template and inject tab-specific attributes
		$tab_element = $template;

		// Remove closing > to append more attributes
		$tab_element  = preg_replace( '/>$/', '', $tab_element );
		$tab_element .= sprintf(
			' id="tab__%1$s" href="#%1$s" role="tab" aria-controls="%1$s" ' .
			'data-wp-on--click="actions.handleTabClick" ' .
			'data-wp-on--keydown="actions.handleTabKeyDown" ' .
			'data-wp-bind--aria-selected="state.isActiveTab" ' .
			'data-wp-bind--tabindex="state.tabIndexAttribute">%2$s</a>',
			$tab_id,
			html_entity_decode( $tab_label )
		);
		$tabs_markup .= $tab_element;
	}

	// Process container and inject color custom properties
	$tag_processor = new WP_HTML_Tag_Processor( $content );
	$tag_processor->next_tag( array( 'class_name' => 'wp-block-tabs-menu' ) );

	// Add color custom properties to container style
	$existing_style = (string) $tag_processor->get_attribute( 'style' );
	$color_styles   = block_core_tabs_menu_generate_color_styles( $attributes );
	$border_styles  = block_core_tabs_menu_generate_border_styles( $attributes );
	$combined_style = trim( $existing_style . ' ' . $color_styles . ' ' . $border_styles );

	if ( ! empty( $combined_style ) ) {
		$tag_processor->set_attribute( 'style', $combined_style );
	}

	$updated_content = $tag_processor->get_updated_html();

	// Replace template element with actual tabs
	$final_content = preg_replace(
		'/<a[^>]*class="[^"]*tabs__tab-template[^"]*"[^>]*>(?:<\/a>)?/i',
		$tabs_markup,
		$updated_content
	);

	return is_string( $final_content ) ? $final_content : $updated_content;
}

/**
 * Registers the `core/tabs-menu` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_tabs_menu() {
	register_block_type_from_metadata(
		__DIR__ . '/tabs-menu',
		array(
			'render_callback' => 'block_core_tabs_menu_render_callback',
		)
	);
}
add_action( 'init', 'register_block_core_tabs_menu' );
