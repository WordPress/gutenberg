<?php
/**
 * Registers the fields of the `wp_template` collection: the fields templates
 * have instead of the defaults.
 *
 * Templates support authors, so they get the default author field of the
 * `post_supports` collection like any other post type. Yet their author is
 * the theme, plugin, site, or user that provides them, so the default author
 * field registered by `core` is replaced with the one of this collection. A
 * field with the same id a plugin registered in its place is kept.
 *
 * @package WordPress
 */

/**
 * Registers the fields of the `wp_template` collection for templates, in
 * place of the defaults registered by `core`.
 *
 * It runs right after the default fields are registered, on
 * `fields_api_init` at priority 9, so a plugin hooking the action at the
 * default priority sees the final defaults.
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_fields_wp_template( $registry ) {
	$post_type = get_post_type_object( 'wp_template' );
	if ( ! $post_type || ! $post_type->show_in_rest ) {
		return;
	}

	$registered = array_column( $registry->get_registered( 'postType', 'wp_template' ), null, 'id' );
	$replaced   = array();
	$added      = array();
	foreach ( wp_get_field_collection_fields( __DIR__ ) as $id => $field ) {
		$current = $registered[ $id ] ?? null;
		if ( null === $current || 'core' === $current['origin']['registeredBy'] ) {
			$replaced[] = $id;
			$added[]    = $field;
		}
	}

	if ( empty( $added ) ) {
		return;
	}

	$registry->unregister( 'postType', 'wp_template', $replaced );
	$registry->register( 'core', 'postType', 'wp_template', $added, '@wordpress/core-fields/wp_template' );
}
add_action( 'fields_api_init', 'register_core_fields_wp_template', 9 );
