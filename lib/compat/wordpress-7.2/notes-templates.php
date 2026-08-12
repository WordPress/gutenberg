<?php
/**
 * Notes (block comments) support for templates and template parts.
 *
 * Notes are gated on the `editor.notes` post type feature, checked both in PHP
 * (WP_REST_Comments_Controller::check_post_type_supports_notes()) and in JS
 * (packages/editor/src/components/post-type-support-check). Core registers
 * `wp_template` and `wp_template_part` with a plain `editor` feature, so notes
 * are refused for them. Declaring the feature as an array opts both post types
 * in without changing the truthiness of `post_type_supports( $type, 'editor' )`.
 *
 * Notes only attach to templates that exist as posts in the database, i.e.
 * user-created or customized templates. A pristine theme-provided template has
 * no post to hang a comment off, so the editor keeps its Notes UI hidden until
 * the template is saved. See
 * https://github.com/WordPress/gutenberg/issues/72918.
 *
 * Permissions need no special handling: both post types map every primitive
 * capability to `edit_theme_options`, so the `edit_post` meta cap the comments
 * controller already checks resolves to the template editing capability.
 *
 * @package gutenberg
 */

/**
 * Declares Notes support for the template post types.
 *
 * @since 7.2.0
 */
function gutenberg_notes_add_template_post_type_support() {
	add_post_type_support( 'wp_template', 'editor', array( 'notes' => true ) );
	add_post_type_support( 'wp_template_part', 'editor', array( 'notes' => true ) );
}
add_action( 'init', 'gutenberg_notes_add_template_post_type_support', 11 );
