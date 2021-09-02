<?php
/**
 * Server-side rendering of the `core/menu-item` block.
 *
 * @package gutenberg
 */

/**
 * Returns a navigation link variation
 *
 * @param WP_Taxonomy|WP_Post_Type $entity post type or taxonomy entity.
 * @param string                   $kind string of value 'taxonomy' or 'post-type'.
 *
 * @return array
 */
function build_variation_for_menu_item( $entity, $kind ) {
	$title       = '';
	$description = '';

	if ( property_exists( $entity->labels, 'item_link' ) ) {
		$title = $entity->labels->item_link;
	}
	if ( property_exists( $entity->labels, 'item_link_description' ) ) {
		$description = $entity->labels->item_link_description;
	}

	$variation = array(
		'name'        => $entity->name,
		'title'       => $title,
		'description' => $description,
		'attributes'  => array(
			'type' => $entity->name,
			'kind' => $kind,
		),
	);

	// Tweak some value for the variations.
	$variation_overrides = array(
		'post_tag'    => array(
			'name'       => 'tag',
			'attributes' => array(
				'type' => 'tag',
				'kind' => $kind,
			),
		),
		'post_format' => array(
			// The item_link and item_link_description for post formats is the
			// same as for tags, so need to be overridden.
			'title'       => __( 'Post Format Link' ),
			'description' => __( 'A link to a post format' ),
			'attributes'  => array(
				'type' => 'post_format',
				'kind' => $kind,
			),
		),
	);

	if ( array_key_exists( $entity->name, $variation_overrides ) ) {
		$variation = array_merge(
			$variation,
			$variation_overrides[ $entity->name ]
		);
	}

	return $variation;
}

/**
 * Register the navigation link block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_edit_navigation_menu_item() {
	$post_types = get_post_types( array( 'show_in_nav_menus' => true ), 'objects' );
	$taxonomies = get_taxonomies( array( 'show_in_nav_menus' => true ), 'objects' );

	// Use two separate arrays as a way to order the variations in the UI.
	// Known variations (like Post Link and Page Link) are added to the
	// `built_ins` array. Variations for custom post types and taxonomies are
	// added to the `variations` array and will always appear after `built-ins.
	$built_ins  = array();
	$variations = array();

	if ( $post_types ) {
		foreach ( $post_types as $post_type ) {
			$variation = build_variation_for_navigation_link( $post_type, 'post-type' );
			if ( 'post' === $variation['name'] || 'page' === $variation['name'] ) {
				$built_ins[] = $variation;
			} else {
				$variations[] = $variation;
			}
		}
	}
	if ( $taxonomies ) {
		foreach ( $taxonomies as $taxonomy ) {
			$variation = build_variation_for_navigation_link( $taxonomy, 'taxonomy' );
			if ( 'category' === $variation['name'] || 'tag' === $variation['name'] || 'post_format' === $variation['name'] ) {
				$built_ins[] = $variation;
			} else {
				$variations[] = $variation;
			}
		}
	}

	register_block_type_from_metadata(
		__DIR__ . '/menu-item',
		array(
			'variations' => array_merge( $built_ins, $variations ),
		)
	);
}
add_action( 'init', 'register_block_edit_navigation_menu_item' );
