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

	$styles = array(
		'--custom-tab-active-color'      => $active_bg,
		'--custom-tab-active-text-color' => $active_text,
		'--custom-tab-hover-color'       => $hover_bg,
		'--custom-tab-hover-text-color'  => $hover_text,
	);

	$style_string = array_map(
		static function ( string $key, string $value ): string {
			return ! empty( $value ) ? $key . ': ' . $value . ';' : '';
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

	// Build tabs list markup with Interactivity API directives
	$tabs_markup = '';
	foreach ( $tabs_list as $tab ) {
		$tab_id    = esc_attr( $tab['id'] ?? '' );
		$tab_label = esc_html( $tab['label'] ?? '' );

		if ( empty( $tab_id ) ) {
			continue;
		}

		$tabs_markup .= sprintf(
			'<a id="tab__%1$s" class="tabs__tab-label" href="#%1$s" role="tab" aria-controls="%1$s" data-wp-on--click="actions.handleTabClick" data-wp-on--keydown="actions.handleTabKeyDown" data-wp-bind--aria-selected="state.isActiveTab" data-wp-bind--tabindex="state.tabIndexAttribute">%2$s</a>',
			$tab_id,
			html_entity_decode( $tab_label )
		);
	}

	// Process saved content to inject tabs
	$tag_processor = new WP_HTML_Tag_Processor( $content );
	$tag_processor->next_tag( array( 'class_name' => 'wp-block-tabs-menu' ) );

	// Add custom color styles
	$style  = (string) $tag_processor->get_attribute( 'style' );
	$style .= block_core_tabs_menu_generate_color_styles( $attributes );
	$style .= block_core_tabs_menu_generate_border_styles( $attributes );
	$tag_processor->set_attribute( 'style', $style );

	$updated_content = $tag_processor->get_updated_html();

	// Replace empty tablist with populated one
	$content = preg_replace(
		'/<div([^>]*class="[^"]*wp-block-tabs-menu[^"]*"[^>]*)>\s*<\/div>/i',
		'<div$1>' . $tabs_markup . '</div>',
		(string) $updated_content
	);

	return is_string( $content ) ? $content : (string) $updated_content;
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
