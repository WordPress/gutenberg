<?php
/**
 * Places the fields of the `wp_template` collection: the fields templates
 * have instead of the defaults.
 *
 * Templates support authors, so they get the default author field of the
 * `post_supports` collection like any other post type. Yet their author is
 * the theme, plugin, site, or user that provides them, so the default author
 * field registered by `core` is replaced with the one of this collection. A
 * field with the same id a plugin registered in its place is kept.
 *
 * @package gutenberg
 */

/**
 * Registers the fields of the collection for templates.
 *
 * @param Gutenberg_Fields_Registry $registry The registry being read.
 * @param array[]                   $fields   The fields of the collection, each with an `id`.
 * @param string|null               $module   The script module of the collection, if any.
 */
return static function ( $registry, $fields, $module ) {
	$post_type = get_post_type_object( 'wp_template' );
	if ( ! $post_type || ! $post_type->show_in_rest ) {
		return;
	}

	$registered = array_column( $registry->get_registered( 'postType', 'wp_template' ), null, 'id' );
	$replaced   = array();
	$added      = array();
	foreach ( $fields as $field ) {
		$current = $registered[ $field['id'] ] ?? null;
		if ( null === $current || 'core' === $current['origin']['registeredBy'] ) {
			$replaced[] = $field['id'];
			$added[]    = $field;
		}
	}

	if ( empty( $added ) ) {
		return;
	}

	$registry->unregister( 'postType', 'wp_template', $replaced );
	$registry->register( 'core', 'postType', 'wp_template', $added, $module );
};
