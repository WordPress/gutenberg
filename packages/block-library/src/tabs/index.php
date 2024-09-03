<?php
/**
 * Server-side rendering of the `core/tabs` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/tabs` block on the server.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content.
 */
function render_block_core_tabs( $attributes, $content ) {
	if ( ! $content ) {
		return '';
	}

	// Enqueue script modules for interactivity API.
	$suffix = wp_scripts_get_suffix();
	if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
		$module_url = gutenberg_url( '/build/interactivity/tabs.min.js' );
	}

	wp_register_script_module(
		'@wordpress/block-library/tabs',
		isset( $module_url ) ? $module_url : includes_url( "blocks/tabs/view{$suffix}.js" ),
		array( '@wordpress/interactivity' ),
		defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
	);

	wp_enqueue_script_module( '@wordpress/block-library/tabs' );

	// Modify markup to include interactivity API attributes.
	$p = new WP_HTML_Tag_Processor( $content );

	// Generate a dictionary of tab panel and tab label ids used to populate aria attributes.
	$tab_panel_to_label_id = array();
	while ( $p->next_tag( array( 'class_name' => 'wp-block-tabs__tab-label' ) ) ) {
		$tab_label_href = $p->get_attribute( 'href' );
		$tab_panel_id   = $tab_label_href ? substr( $tab_label_href, 1 ) : '';
		$tab_label_id   = $p->get_attribute( 'id' );

		$tab_panel_to_label_id[ $tab_panel_id ] = $tab_label_id;
	}

	// Reset the processor to the beginning of the content.
	$p = new WP_HTML_Tag_Processor( $content );

	$title_id        = wp_unique_id( 'tablist-label-' );
	$tab_label_index = 0;
	while ( $p->next_tag() ) {
		if ( $p->has_class( 'wp-block-tabs' ) ) {
			// Add class interactive to the block wrapper to indicate JavaScript has been loaded.
			$p->set_attribute( 'data-wp-class--interactive', 'state' );

			// Set up interactivity API and context.
			$p->set_attribute( 'data-wp-interactive', 'core/tabs' );
			$p->set_attribute( 'data-wp-context', '{ "activeTabIndex": 0 }' );
		} elseif ( $p->has_class( 'wp-block-tabs__title' ) ) {
			// Set a unique ID for the title, so it can be used by aria-labelledby.
			$p->set_attribute( 'id', $title_id );
		} elseif ( $p->has_class( 'wp-block-tabs__list' ) ) {
			// Add role="tablist" to the <ul> element.
			$p->set_attribute( 'data-wp-bind--role', 'state.roleAttribute' );

			// Add aria-labelledby attribute with the title ID to the <ul> element.
			$p->set_attribute( 'data-wp-bind--aria-labelledby', $title_id );
		} elseif ( $p->has_class( 'wp-block-tabs__list-item' ) ) {
			// Add role="presentation" to each <li> element, because the inner <a> elements are the actual tabs.
			$p->set_attribute( 'data-wp-bind--role', 'state.roleAttribute' );
		} elseif ( $p->has_class( 'wp-block-tabs__tab-label' ) ) {
			$tab_label_href = $p->get_attribute( 'href' );
			$tab_panel_id   = $tab_label_href ? substr( $tab_label_href, 1 ) : '';
			if ( $tab_panel_id ) {
				// Add aria-controls attribute with the corresponding tab panel ID to each tab label.
				$p->set_attribute( 'data-wp-bind--aria-controls', $tab_panel_id );
			}

			// Add role="tab" to the <a> element that labels each tab panel.
			$p->set_attribute( 'data-wp-bind--role', 'state.roleAttribute' );

			// Add aria-selected attribute indicating if the tab is currently selected.
			$p->set_attribute( 'data-wp-bind--aria-selected', 'state.isActiveTab' );

			// Add tabindex="-1" to all non-selected tab labels, since they can be selected with arrow keys.
			$p->set_attribute( 'data-wp-bind--tabindex', 'state.tabindexLabelAttribute' );

			// Add click and keydown event handlers to each tab label.
			$p->set_attribute( 'data-wp-on--click', 'actions.handleTabClick' );
			$p->set_attribute( 'data-wp-on--keydown', 'actions.handleTabKeyDown' );

			// Store the index of each tab label for tracking the selected tab.
			$p->set_attribute( 'data-tab-index', $tab_label_index );
			++$tab_label_index;
		} elseif ( $p->has_class( 'wp-block-tab' ) ) {
			$tab_panel_id = $p->get_attribute( 'id' );
			$tab_label_id = $tab_panel_id && isset( $tab_panel_to_label_id[ $tab_panel_id ] )
			? $tab_panel_to_label_id[ $tab_panel_id ]
			: '';

			if ( $tab_label_id ) {
				// Add aria-labelledby attribute with the corresponding tab label ID to each tab panel.
				$p->set_attribute( 'data-wp-bind--aria-labelledby', $tab_label_id );
			}
		}
	}

	return $p->get_updated_html();
}

/**
 * Registers the `core/tabs` block on server.
 */
function register_block_core_tabs() {
	register_block_type_from_metadata(
		__DIR__ . '/tabs',
		array(
			'render_callback' => 'render_block_core_tabs',
		)
	);
}
add_action( 'init', 'register_block_core_tabs' );
