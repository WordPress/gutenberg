<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Ensure the selectors, set via block.json metadata, are included within the
 * block type's settings.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/46496
 *
 * @param array $settings Current block type settings.
 * @param array $metadata Block metadata as read in via block.json.
 *
 * @return array Filtered block type settings.
 */
function gutenberg_add_selectors_property_to_block_type_settings( $settings, $metadata ) {
	if ( ! isset( $settings['selectors'] ) && isset( $metadata['selectors'] ) ) {
		$settings['selectors'] = $metadata['selectors'];
	}

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_add_selectors_property_to_block_type_settings', 10, 2 );

/**
 * Renames Reusable block CPT to Pattern.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @param array  $args Register post type args.
 * @param string $post_type The post type string.
 *
 * @return array Register post type args.
 */
function gutenberg_rename_reusable_block_cpt_to_pattern( $args, $post_type ) {
	if ( 'wp_block' === $post_type ) {
		$args['labels']['name']                     = _x( 'Patterns', 'post type general name' );
		$args['labels']['singular_name']            = _x( 'Pattern', 'post type singular name' );
		$args['labels']['add_new_item']             = __( 'Add new Pattern' );
		$args['labels']['new_item']                 = __( 'New Pattern' );
		$args['labels']['edit_item']                = __( 'Edit Pattern' );
		$args['labels']['view_item']                = __( 'View Pattern' );
		$args['labels']['all_items']                = __( 'All Patterns' );
		$args['labels']['search_items']             = __( 'Search Patterns' );
		$args['labels']['not_found']                = __( 'No Patterns found.' );
		$args['labels']['not_found_in_trash']       = __( 'No Patterns found in Trash.' );
		$args['labels']['filter_items_list']        = __( 'Filter Patterns list' );
		$args['labels']['items_list_navigation']    = __( 'Patterns list navigation' );
		$args['labels']['items_list']               = __( 'Patterns list' );
		$args['labels']['item_published']           = __( 'Pattern published.' );
		$args['labels']['item_published_privately'] = __( 'Pattern published privately.' );
		$args['labels']['item_reverted_to_draft']   = __( 'Pattern reverted to draft.' );
		$args['labels']['item_scheduled']           = __( 'Pattern scheduled.' );
		$args['labels']['item_updated']             = __( 'Pattern updated.' );
	}

	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_rename_reusable_block_cpt_to_pattern', 10, 2 );

/**
 * Adds custom fields support to the wp_block post type so an unsynced option can be added.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @param array  $args Register post type args.
 * @param string $post_type The post type string.
 *
 * @return array Register post type args.
 */
function gutenberg_add_custom_fields_to_wp_block( $args, $post_type ) {
	if ( 'wp_block' === $post_type ) {
		array_push( $args['supports'], 'custom-fields' );
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_add_custom_fields_to_wp_block', 10, 2 );

/**
 * Adds sync_status meta fields to the wp_block post type so an unsynced option can be added.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @return void
 */
function gutenberg_wp_block_register_post_meta() {
	$post_type = 'wp_block';
	register_post_meta(
		$post_type,
		'sync_status',
		array(
			'auth_callback'     => function() {
				return current_user_can( 'edit_posts' );
			},
			'sanitize_callback' => 'gutenberg_wp_block_sanitize_post_meta',
			'single'            => true,
			'type'              => 'string',
			'show_in_rest'      => array(
				'schema' => array(
					'type'       => 'string',
					'properties' => array(
						'sync_status' => array(
							'type' => 'string',
						),
					),
				),
			),
		)
	);
}
/**
 * Sanitizes the array of wp_block post meta sync_status string.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @param array $meta_value String to sanitize.
 *
 * @return array Sanitized string.
 */
function gutenberg_wp_block_sanitize_post_meta( $meta_value ) {
	return sanitize_text_field( $meta_value );
}
add_action( 'init', 'gutenberg_wp_block_register_post_meta' );
