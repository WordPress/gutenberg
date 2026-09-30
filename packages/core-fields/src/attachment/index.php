<?php
/**
 * Registers the fields of the `attachment` collection: the fields of the
 * media editor ported to the server so far.
 *
 * Attachments support authors and comments, so they get the default author
 * and comment status fields of the `post_supports` collection like any other
 * post type. Yet the media editor shows its own set of fields, declared
 * client-side in packages/media-fields/src, none of which is a default one.
 * The fields registered by `core` are dropped and the fields of this
 * collection are registered instead. Fields registered by plugins in between
 * are kept. The fields are plain data, so the collection has no script
 * module.
 *
 * @package WordPress
 */

/**
 * Replaces the default fields of attachments with the fields of the
 * `attachment` collection.
 *
 * It runs right after the default fields are registered, on
 * `fields_api_init` at priority 9, so a plugin hooking the action at the
 * default priority sees the final defaults.
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_fields_attachment( $registry ) {
	$post_type = get_post_type_object( 'attachment' );
	if ( ! $post_type || ! $post_type->show_in_rest ) {
		return;
	}

	// Drop the fields registered by core only: any other field a plugin
	// registered for attachments at an earlier priority stays.
	$defaults = array();
	foreach ( $registry->get_registered( 'postType', 'attachment' ) as $field ) {
		if ( 'core' === $field['origin']['registeredBy'] ) {
			$defaults[] = $field['id'];
		}
	}
	$registry->unregister( 'postType', 'attachment', $defaults );
	$registry->register( 'core', 'postType', 'attachment', array_values( wp_get_field_collection_fields( __DIR__ ) ) );
}
add_action( 'fields_api_init', 'register_core_fields_attachment', 9 );
