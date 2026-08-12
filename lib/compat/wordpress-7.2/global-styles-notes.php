<?php
/**
 * Notes support for the Style Book.
 *
 * Notes (block commenting) shipped in WordPress 6.9 anchored to a post: a note
 * is a `note`-type comment whose `comment_post_ID` is the edited post, and the
 * block it belongs to is recorded in that block's `metadata.noteId` attribute.
 *
 * The Style Book has no edited post and no persisted blocks - it renders
 * generated example block trees that get fresh client ids on every render - so
 * neither half of that model applies. Two pieces bridge the gap:
 *
 * 1. Storage: notes are stored against the user `wp_global_styles` post, the
 *    same record the Styles UI already edits. That makes Style Book notes
 *    theme-specific, since core keeps one such post per theme, which matches
 *    the fact that the styles being reviewed are themselves theme-specific.
 * 2. Anchoring: each note carries a `_wp_note_anchor` comment meta holding the
 *    Style Book example name it was left on (`core/button`, `typography`,
 *    `theme-colors`, ...). Those names are deterministic and stable across
 *    sessions, users and reloads, unlike block client ids.
 *
 * Everything else - permissions, the `_wp_note_status` resolution flow, kses on
 * note content, mention handling - is the unmodified 6.9 comments controller.
 *
 * @package gutenberg
 */

/**
 * Adds notes support to the `wp_global_styles` post type.
 *
 * `WP_REST_Comments_Controller::check_post_type_supports_notes()` gates every
 * note read and write on the post type declaring `'editor' => array( 'notes' =>
 * true )`, and `wp_global_styles` registers a bare `editor` support. Passing
 * arguments to `add_post_type_support()` stores them as
 * `array( array( 'notes' => true ) )`, which is the shape that check reads;
 * `post_type_supports( 'wp_global_styles', 'editor' )` only tests for the key,
 * so it keeps returning true and nothing that relies on plain editor support
 * regresses.
 *
 * Core equivalent for WordPress 7.2: add the same argument to the
 * `wp_global_styles` registration in `create_initial_post_types()`.
 */
function gutenberg_add_global_styles_notes_support() {
	$supports = get_all_post_type_supports( 'wp_global_styles' );

	// Core (or another plugin) already declared notes support; leave it alone
	// rather than overwriting whatever arguments it registered.
	if (
		isset( $supports['editor'] ) &&
		is_array( $supports['editor'] ) &&
		array_any( $supports['editor'], static fn( $item ) => ! empty( $item['notes'] ) )
	) {
		return;
	}

	add_post_type_support( 'wp_global_styles', 'editor', array( 'notes' => true ) );
}
add_action( 'init', 'gutenberg_add_global_styles_notes_support', 20 );

/**
 * Registers the Style Book note anchor comment meta.
 *
 * The anchor is the Style Book example name the note was left on. It cannot be
 * an enum: third-party blocks appear in the Style Book, so the set of valid
 * names is only known at runtime. It is instead a sanitized, length-capped
 * string treated as an opaque token - the editor maps it back to a human
 * readable title and falls back to a generic label for anchors it does not
 * recognise, so an unknown value is never rendered as-is.
 *
 * Modelled on `_wp_note_status` in `wp_create_initial_comment_meta()`,
 * including the `edit_comment` auth callback. Core equivalent for WordPress
 * 7.2: register this alongside `_wp_note_status` in that function.
 */
function gutenberg_register_note_anchor_meta() {
	// Core (7.2+) already registered it.
	if ( registered_meta_key_exists( 'comment', '_wp_note_anchor' ) ) {
		return;
	}

	register_meta(
		'comment',
		'_wp_note_anchor',
		array(
			'type'              => 'string',
			'description'       => __( 'Style Book section the note is anchored to.', 'gutenberg' ),
			'single'            => true,
			'sanitize_callback' => 'sanitize_text_field',
			'show_in_rest'      => array(
				'schema' => array(
					'type'      => 'string',
					'maxLength' => 100,
				),
			),
			'auth_callback'     => function ( $allowed, $meta_key, $object_id ) {
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_note_anchor_meta' );
