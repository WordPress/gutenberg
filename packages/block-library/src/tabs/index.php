<?php
/**
 * Tabs Block
 *
 * @package WordPress
 */

/**
 * Extract tabs list from tab-panel innerblocks.
 *
 * @since 7.0.0
 *
 * @param array $innerblocks Parsed inner blocks of tabs block.
 *
 * @return array List of tabs with id, label, index.
 */
function block_core_tabs_generate_tabs_list( array $innerblocks = array() ): array {
	$tabs_list = array();

	// Find tab-panel block
	foreach ( $innerblocks as $inner_block ) {
		if ( 'core/tab-panel' === ( $inner_block['blockName'] ?? '' ) ) {
			$tab_index = 0;
			foreach ( $inner_block['innerBlocks'] ?? array() as $tab_block ) {
				if ( 'core/tab' === ( $tab_block['blockName'] ?? '' ) ) {
					$attrs     = $tab_block['attrs'] ?? array();
					$tab_label = $attrs['label'] ?? '';

					// Try to get the ID from the rendered content
					$tab_id = $attrs['anchor'] ?? '';
					if ( empty( $tab_id ) && ! empty( $tab_block['innerHTML'] ) ) {
						$tag_processor = new WP_HTML_Tag_Processor( $tab_block['innerHTML'] );
						if ( $tag_processor->next_tag( array( 'class_name' => 'wp-block-tab' ) ) ) {
							$tab_id = $tag_processor->get_attribute( 'id' ) ?? '';
						}
					}
					if ( empty( $tab_id ) ) {
						$tab_id = 'tab-' . $tab_index;
					}

					$tabs_list[] = array(
						'id'    => $tab_id,
						'label' => esc_html( (string) $tab_label ),
						'index' => $tab_index,
					);
					++$tab_index;
				}
			}
			break;
		}
	}

	return $tabs_list;
}

/**
 * Filter to provide tabs list context to core/tabs and core/tabs-menu blocks.
 * It is more performant to do this here, once, rather than in the tabs render and tabs context filters.
 * In this way core/tabs is both a provider and a consumer of the core/tabs-list context.
 *
 * @since 7.0.0
 *
 * @param array $context      Default block context.
 * @param array $parsed_block The block being rendered.
 *
 * @return array Modified context.
 */
function block_core_tabs_provide_context( array $context, array $parsed_block ): array {
	if ( 'core/tabs' === $parsed_block['blockName'] ) {
		$tabs_list                 = block_core_tabs_generate_tabs_list( $parsed_block['innerBlocks'] ?? array() );
		$context['core/tabs-list'] = $tabs_list;
		$context['core/tabs-id']   = $parsed_block['attrs']['anchor'] ?? wp_unique_id( 'tabs_' ); // Generate a unique ID for each tabs instance. Used for 3rd party extensibility to identify the tabs instance.
	}

	return $context;
}
add_filter( 'render_block_context', 'block_core_tabs_provide_context', 10, 2 );

/**
 * Render callback for core/tabs.
 *
 * @since 7.0.0
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content.
 * @param \WP_Block $block      WP_Block instance.
 *
 * @return string Updated HTML.
 */
function block_core_tabs_render_block_callback( array $attributes, string $content, \WP_Block $block ): string {
	$active_tab_index = $attributes['activeTabIndex'] ?? 0;
	$tabs_list        = $block->context['core/tabs-list'] ?? array();
	$tabs_id          = $block->context['core/tabs-id'] ?? null;

	if ( empty( $tabs_id ) ) {
		// If malformed tabs, return early to avoid errors.
		return '';
	}

	$is_vertical = false;

	$tag_processor = new WP_HTML_Tag_Processor( $content );

	$tag_processor->next_tag( array( 'class_name' => 'wp-block-tabs' ) );
	$tag_processor->set_attribute( 'data-wp-interactive', 'core/tabs/private' );

	// Inspect inside the tabs-menu to see if its vertical or not.
	$tag_processor->set_bookmark( 'core/tabs_wrapper' );
	while ( $tag_processor->next_tag( array( 'class_name' => 'wp-block-tabs-menu' ) ) ) {
		if ( $tag_processor->has_class( 'is-vertical' ) ) {
			$is_vertical = true;
			break;
		}
	}
	$tag_processor->seek( 'core/tabs_wrapper' );

	$tag_processor->set_attribute(
		'data-wp-context',
		wp_json_encode(
			array(
				'tabsId'         => $tabs_id,
				'activeTabIndex' => $active_tab_index,
				'isVertical'     => $is_vertical,
			)
		)
	);
	$tag_processor->set_attribute( 'data-wp-init', 'callbacks.onTabsInit' );
	$tag_processor->set_attribute( 'data-wp-on--keydown', 'actions.handleTabKeyDown' );

	$output = $tag_processor->get_updated_html();

	/**
	 * Builds a client side state for just this tabs instance.
	 * This allows 3rd party extensibility of tabs while retaining
	 * client side state management per core/tabs instance, like context.
	 */
	wp_interactivity_state(
		'core/tabs/private',
		array(
			$tabs_id => $tabs_list,
		)
	);

	return $output;
}

/**
 * Registers the `core/tabs` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_tabs() {
	register_block_type_from_metadata(
		__DIR__ . '/tabs',
		array(
			'render_callback' => 'block_core_tabs_render_block_callback',
		)
	);
}
add_action( 'init', 'register_block_core_tabs' );
