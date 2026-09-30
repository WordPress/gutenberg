<?php
/**
 * The `post_supports` collection: the default fields of every post type
 * exposed in the REST API, each derived from a support of the post type.
 *
 * - `author`, for the post types supporting `author`.
 * - `comment_status`, for the post types supporting `comments`.
 * - `notesCount`, for the post types whose `editor` support has the `notes`
 *   argument.
 *
 * The `supports` of each `field.php` declares the support it derives from.
 * A post type whose own collection redefines or drops some of these fields
 * excludes them on the `fields_api_exclude_post_type_supports` filter, see
 * the `exclude-post-type-supports.php` of the `wp_template`,
 * `wp_template_part`, and `attachment` collections.
 *
 * Only the author field has JavaScript parts, but every field of the
 * collection is registered with its script module: a post type supporting
 * only comments or notes lists the module too, which is small.
 *
 * @package WordPress
 */

return array(
	'origin' => 'core',
	'kind'   => 'postType',
	'name'   => null,
	'module' => '@wordpress/core-fields/post_supports',
);
