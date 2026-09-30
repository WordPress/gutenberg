<?php
/**
 * Places the fields of the `attachment` collection: the fields of the media
 * editor ported to the server so far.
 *
 * Attachments support authors and comments, so they get the default author
 * and comment status fields of the `post_supports` collection like any other
 * post type. Yet the media editor shows its own set of fields, declared
 * client-side in packages/media-fields/src, none of which is a default one.
 * The fields registered by `core` are dropped and the fields of this
 * collection are registered instead. Fields registered by plugins in between
 * are kept.
 *
 * @package gutenberg
 */

/**
 * Replaces the default fields of attachments with the fields of the collection.
 *
 * @param Gutenberg_Fields_Registry $registry The registry being read.
 * @param array[]                   $fields   The fields of the collection, each with an `id`.
 * @param string|null               $module   The script module of the collection, if any.
 */
return static function ( $registry, $fields, $module ) {
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
	$registry->register( 'core', 'postType', 'attachment', $fields, $module );
};
