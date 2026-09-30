<?php
/**
 * The `wp_template_part` collection: the fields template parts have instead
 * of the defaults.
 *
 * Template parts support authors, yet they have their own author field,
 * declared client-side in
 * packages/fields/src/fields/template-author/index.tsx, which reads the
 * theme or plugin that provides them instead of the post author. So they
 * opt out of the default author field, which the collection unregisters.
 * The collection has no fields of its own yet.
 *
 * @package WordPress
 */

return array(
	'origin'     => 'core',
	'kind'       => 'postType',
	'name'       => 'wp_template_part',
	'unregister' => array( 'author' ),
);
