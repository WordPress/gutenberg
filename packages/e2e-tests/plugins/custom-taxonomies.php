<?php
/**
 * Plugin Name: Gutenberg Test Custom Taxonomies
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-taxonomies
 */

/**
 * Registers a taxonomy with custom labels
 */
function taxonomy_custom_label() {
	register_taxonomy(
		'model',
		'post',
		array(
			'labels'            => array(
				'name'                       => 'Models',
				'singular_name'              => 'Model',
				'menu_name'                  => 'Model',
				'all_items'                  => 'All Models',
				'parent_item'                => 'Parent Model',
				'parent_item_colon'          => 'Parent Model:',
				'new_item_name'              => 'New Model name',
				'add_new_item'               => 'Add New Model',
				'edit_item'                  => 'Edit Model',
				'update_item'                => 'Update Model',
				'view_item'                  => 'View Model',
				'separate_items_with_commas' => 'Separate models with commas',
				'add_or_remove_items'        => 'Add or remove models',
				'choose_from_most_used'      => 'Choose from the most used',
				'popular_items'              => 'Popular Models',
				'search_items'               => 'Search Models',
				'not_found'                  => 'Not Found',
				'no_terms'                   => 'No models',
				'items_list'                 => 'Models list',
				'items_list_navigation'      => 'Models list navigation',
			),
			'hierarchical'      => false,
			'public'            => true,
			'show_ui'           => true,
			'show_admin_column' => true,
			'show_in_nav_menus' => true,
			'show_tagcloud'     => true,
			'show_in_rest'      => true,
		)
	);
}

add_action( 'init', 'taxonomy_custom_label' );
