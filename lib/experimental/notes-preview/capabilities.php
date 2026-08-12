<?php
/**
 * Meta capabilities for reading and creating notes on a given post.
 *
 * Notes (comments of type `note`) are editorial discussion attached to blocks.
 * Core gates every note operation on `edit_post` for the post the note belongs
 * to, which means anyone who may read or write a note must also be able to edit
 * the post. Sites that want a reviewer role - legal, compliance, an external
 * stakeholder - therefore have to hand out full editing rights.
 *
 * These two meta capabilities separate note access from post editing:
 *
 * - `read_post_notes`   - may read the note threads on a post.
 * - `create_post_notes` - may reply to a note thread on a post.
 *
 * Both are checked against a post ID, following the `edit_post_meta` /
 * `add_post_meta` shape core uses for post sub-resources:
 *
 *     current_user_can( 'read_post_notes', $post->ID );
 *
 * By default both map straight to `edit_post`, so installing this experiment
 * changes nothing: exactly the people who can read and write notes today still
 * can, and nobody else gains anything.
 *
 * To grant them independently, filter `map_meta_cap` at a priority later than
 * 10 and return the primitive capabilities the role should be measured
 * against. For example, to let every subscriber read (but not write) notes on
 * posts in a particular category:
 *
 *     add_filter(
 *         'map_meta_cap',
 *         function ( $caps, $cap, $user_id, $args ) {
 *             if ( 'read_post_notes' !== $cap || empty( $args[0] ) ) {
 *                 return $caps;
 *             }
 *             if ( ! has_category( 'in-review', $args[0] ) ) {
 *                 return $caps;
 *             }
 *             return array( 'read' );
 *         },
 *         20,
 *         4
 *     );
 *
 * Granting `read_post_notes` implies nothing about `create_post_notes`; a
 * read-only reviewer tier is just the first filter without the second.
 *
 * Resolving and reopening threads is deliberately not covered here. That writes
 * the `_wp_note_status` comment meta, whose `auth_callback` in core requires
 * `edit_comment`, and it stays that way.
 *
 * @package gutenberg
 */

/**
 * Maps the note meta capabilities onto primitive capabilities.
 *
 * @param string[] $caps    Primitive capabilities required of the user.
 * @param string   $cap     Capability being checked.
 * @param int      $user_id The user ID.
 * @param array    $args    Adds context to the capability check, typically
 *                          starting with an object ID.
 * @return string[] Primitive capabilities required of the user.
 */
function gutenberg_map_note_meta_caps( $caps, $cap, $user_id, $args ) {
	if ( 'read_post_notes' !== $cap && 'create_post_notes' !== $cap ) {
		return $caps;
	}

	if ( ! isset( $args[0] ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				/* translators: %s: Capability name. */
				esc_html__( 'When checking for the %s capability, you must always check it against a specific post.', 'gutenberg' ),
				'<code>' . esc_html( $cap ) . '</code>'
			),
			'22.4.0'
		);

		return array( 'do_not_allow' );
	}

	$post = get_post( $args[0] );

	if ( ! $post ) {
		return array( 'do_not_allow' );
	}

	/*
	 * Default to today's behaviour: note access rides on post editing. A site
	 * grants a reviewer role by filtering at a later priority, see the file
	 * docblock.
	 */
	return map_meta_cap( 'edit_post', $user_id, $post->ID );
}

add_filter( 'map_meta_cap', 'gutenberg_map_note_meta_caps', 10, 4 );
