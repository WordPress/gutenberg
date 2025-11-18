<?php
/**
 * WordPress 7.0 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Retrieves a single unified template object using its id.
 * Parses pattern blocks in the template content.
 *
 * @param WP_Block_Template|null $block_template The found block template, or null if there isn't one.
 * @param string                 $id             Template unique identifier (example: 'theme_slug//template_slug').
 * @param string                 $template_type  Template type. Either 'wp_template' or 'wp_template_part'.
 */
function gutenberg_parse_pattern_blocks_in_block_template( $block_template, $id, $template_type ) {
	if ( 'wp_template' !== $template_type ) {
		return $block_template;
	}

	if ( ! empty( $block_template->content ) ) {
		$blocks = parse_blocks( $block_template->content );
		if ( ! empty( $blocks ) ) {
			$blocks                  = gutenberg_resolve_pattern_blocks( $blocks );
			$block_template->content = serialize_blocks( $blocks );
		}
	}
	return $block_template;
}

add_filter( 'get_block_template', 'gutenberg_parse_pattern_blocks_in_block_template', 10, 3 );
add_filter( 'get_block_file_template', 'gutenberg_parse_pattern_blocks_in_block_template', 10, 3 );

/**
 * Retrieves a list of unified template objects based on a query.
 * Parses pattern blocks in the template content items.
 *
 * @param WP_Block_Template[] $query_result Array of found block templates.
 * @param array               $query {
 *     Arguments to retrieve templates. All arguments are optional.
 *
 *     @type string[] $slug__in  List of slugs to include.
 *     @type int      $wp_id     Post ID of customized template.
 *     @type string   $area      A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
 *     @type string   $post_type Post type to get the templates for.
 * }
 * @param string              $template_type wp_template or wp_template_part.
 */
function gutenberg_parse_pattern_blocks_in_block_templates( $query_result, $query, $template_type ) {
	if ( 'wp_template' !== $template_type ) {
		return $query_result;
	}

	if ( ! empty( $query_result ) ) {
		foreach ( $query_result as $template ) {
			$blocks = parse_blocks( $template->content );
			if ( ! empty( $blocks ) ) {
				$blocks            = gutenberg_resolve_pattern_blocks( $blocks );
				$template->content = serialize_blocks( $blocks );
			}
		}
	}
	return $query_result;
}

add_filter( 'get_block_templates', 'gutenberg_parse_pattern_blocks_in_block_templates', 10, 3 );

/**
 * Registers the 'overlay' template part area when the experiment is enabled.
 *
 * @param array $areas Array of template part area definitions.
 * @return array Modified array of template part area definitions.
 */
function gutenberg_register_overlay_template_part_area( $areas ) {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-customizable-navigation-overlays' ) ) {
		return $areas;
	}

	$areas[] = array(
		'area'        => 'overlay',
		'label'       => __( 'Overlay', 'gutenberg' ),
		'description' => __( 'Custom overlay area for navigation overlays.', 'gutenberg' ),
		'icon'        => 'overlay',
		'area_tag'    => 'div',
	);

	return $areas;
}
add_filter( 'default_wp_template_part_areas', 'gutenberg_register_overlay_template_part_area' );

/**
 * Registers the 'overlay' pattern category when the experiment is enabled.
 */
function gutenberg_register_overlay_pattern_category() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-customizable-navigation-overlays' ) ) {
		return;
	}

	register_block_pattern_category(
		'overlay',
		array( 'label' => __( 'Overlay', 'gutenberg' ) )
	);
}
add_action( 'init', 'gutenberg_register_overlay_pattern_category' );

/**
 * Registers the default overlay pattern when the experiment is enabled.
 */
function gutenberg_register_overlay_pattern() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-customizable-navigation-overlays' ) ) {
		return;
	}

	register_block_pattern(
		'gutenberg/overlay-default',
		array(
			'title'      => __( 'Overlay', 'gutenberg' ),
			'categories' => array( 'overlay' ),
			'blockTypes' => array( 'core/template-part/overlay' ),
			'content'    => '<!-- wp:group {"metadata":{"name":"Overlay"},"style":{"dimensions":{"minHeight":"100%"},"spacing":{"padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="min-height:100%;padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:group {"style":{"spacing":{"margin":{"bottom":"var:preset|spacing|40"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"right"}} -->
<div class="wp-block-group" style="margin-bottom:var(--wp--preset--spacing--40)"><!-- wp:overlay-close {"className":"has-text-align-left","style":{"typography":{"textAlign":"left"}}} -->
<div class="wp-block-overlay-close has-text-align-left"><button type="button" class="wp-block-overlay-close__button" aria-label="Close overlay"><span class="wp-block-overlay-close__icon">×</span></button></div>
<!-- /wp:overlay-close --></div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Overlay Content"},"style":{"spacing":{"blockGap":"var:preset|spacing|40"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:navigation {"layout":{"type":"flex","orientation":"vertical","justifyContent":"left"}} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->',
		)
	);
}
add_action( 'init', 'gutenberg_register_overlay_pattern' );
