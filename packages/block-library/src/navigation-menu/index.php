<?php

/**
 * `core/navigation-menu` walker.
 * I WILL MOVE THIS FROM HERE!
 */
class Walker_Simple_Example extends Walker {

	/**
	 * Set the properties of the element which give the ID of the current item and its parent.
	 *
	 * @var $db_fields array
	 */
	var $db_fields = array(
		'parent' => 'parent',
		'id' => 'id'
	);

	function start_lvl(&$output, $depth=0, $args=array()) {
		$output .= "\n<ul>\n";
	}


	function end_lvl(&$output, $depth=0, $args=array()) {
		$output .= "</ul>\n";
	}


	function start_el(&$output, $item, $depth=0, $args=array(), $current_object_id = 0) {
		$output .= "<li>".$item->title[0];
    }


	function end_el(&$output, $item, $depth=0, $args=array()) {
		$output .= "</li>";
	}
}

/**
 * Server-side rendering of the `core/navigation-menu` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/navigation-menu` block on server.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_navigation_menu( $attributes, $content, $block ) {
	$block  = prepare_navigation_for_walker( $block );
	$walker = new Walker_Simple_Example();
	return '<ul>' . $walker->walk( $block, 0 ) . '</ul>';
}

/**
 * Adds parent and child relation to innerBlocks
 *
 * @param array    $block The block.
 * @param int|bool $parent the current parent or false if none.
 * @param array    $block_tree the current tree.
 *
 * @return array Returns the block with ids and parents for innerBlocks.
 */
function prepare_navigation_for_walker( $block, $parent = false, $block_tree = array() ) {
	foreach ( (array) $block['innerBlocks'] as $key => $menu_item ) {
		$current_block     = new stdClass();
		$current_block->id = count( $block_tree ) + 1;
		if ( $parent ) {
			$current_block->parent = $parent;
		}
		$current_block->title = $menu_item['innerContent'];
		$block_tree[]         = $current_block;
		$block_tree           = prepare_navigation_for_walker( $menu_item, $current_block->id, $block_tree );
	}
	return $block_tree;
}

/**
 * Register legacy widget block.
 */
function register_block_core_navigation_menu() {
	register_block_type(
		'core/navigation-menu',
		array(
			'category'        => 'layout',
			'attributes'      => array(
				'automaticallyAdd' => array(
					'type'    => 'boolean',
					'default' => 'false',
				),
			),
			'render_callback' => 'render_block_navigation_menu',
		)
	);
}

add_action( 'init', 'register_block_core_navigation_menu' );
