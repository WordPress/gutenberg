<?php
/**
 * The `wp_template_part` collection: the fields template parts have instead
 * of the defaults.
 *
 * Template parts support authors, yet they have their own author field,
 * declared client-side in
 * packages/fields/src/fields/template-author/index.tsx, which reads the
 * theme or plugin that provides them instead of the post author. So they
 * exclude the default author field of the `post_supports` collection. The
 * collection has no fields of its own yet.
 *
 * @package WordPress
 */

return array(
	'origin'           => 'core',
	'kind'             => 'postType',
	'name'             => 'wp_template_part',
	'exclude_supports' => array( 'author' ),
);
