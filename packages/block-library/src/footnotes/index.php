<?php
/**
 * Server-side rendering of the `core/footnotes` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/footnotes` block on the server.
 *
 * @since 6.3.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the footnotes.
 */
function render_block_core_footnotes( $attributes, $content, $block ) {
	// Bail out early if the post ID is not set for some reason.
	if ( empty( $block->context['postId'] ) ) {
		return '';
	}

	if ( post_password_required( $block->context['postId'] ) ) {
		return;
	}

	$footnotes = get_post_meta( $block->context['postId'], 'footnotes', true );

	if ( ! $footnotes ) {
		return;
	}

	$footnotes = json_decode( $footnotes, true );

	if ( count( $footnotes ) === 0 ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$block_content = '';

	foreach ( $footnotes as $footnote ) {
		$block_content .= sprintf(
			'<li id="%1$s">%2$s <a href="#%1$s-link">↩︎</a></li>',
			$footnote['id'],
			$footnote['content']
		);
	}

	return sprintf(
		'<ol %1$s>%2$s</ol>',
		$wrapper_attributes,
		$block_content
	);
}

/**
 * Registers the `core/footnotes` block on the server.
 *
 * @since 6.3.0
 */
function register_block_core_footnotes() {
	foreach ( array( 'post', 'page' ) as $post_type ) {
		register_post_meta(
			$post_type,
			'footnotes',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);
	}
	register_block_type_from_metadata(
		__DIR__ . '/footnotes',
		array(
			'render_callback' => 'render_block_core_footnotes',
		)
	);
}
add_action( 'init', 'register_block_core_footnotes' );

add_action(
	'wp_after_insert_post',
	/**
	 * Saves the footnotes meta value to the revision.
	 *
	 * @since 6.3.0
	 *
	 * @param int $revision_id The revision ID.
	 */
	static function( $revision_id ) {
		$post_id = wp_is_post_revision( $revision_id );

		if ( $post_id ) {
			$footnotes = get_post_meta( $post_id, 'footnotes', true );

			if ( $footnotes ) {
				// Can't use update_post_meta() because it doesn't allow revisions.
				update_metadata( 'post', $revision_id, 'footnotes', $footnotes );
			}
		}
	}
);

add_action(
	'_wp_put_post_revision',
	/**
	 * Keeps track of the revision ID for "rest_after_insert_{$post_type}".
	 *
	 * @param int $revision_id The revision ID.
	 */
	static function( $revision_id ) {
		global $_gutenberg_revision_id;
		$_gutenberg_revision_id = $revision_id;
	}
);

foreach ( array( 'post', 'page' ) as $post_type ) {
	add_action(
		"rest_after_insert_{$post_type}",
		/**
		 * This is a specific fix for the REST API. The REST API doesn't update
		 * the post and post meta in one go (through `meta_input`). While it
		 * does fix the `wp_after_insert_post` hook to be called correctly after
		 * updating meta, it does NOT fix hooks such as post_updated and
		 * save_post, which are normally also fired after post meta is updated
		 * in `wp_insert_post()`. Unfortunately, `wp_save_post_revision` is
		 * added to the `post_updated` action, which means the meta is not
		 * available at the time, so we have to add it afterwards through the
		 * `"rest_after_insert_{$post_type}"` action.
		 *
		 * @since 6.3.0
		 *
		 * @param WP_Post $post The post object.
		 */
		static function( $post ) {
			global $_gutenberg_revision_id;

			if ( $_gutenberg_revision_id ) {
				$revision = get_post( $_gutenberg_revision_id );
				$post_id  = $revision->post_parent;

				// Just making sure we're updating the right revision.
				if ( $post->ID === $post_id ) {
					$footnotes = get_post_meta( $post_id, 'footnotes', true );

					if ( $footnotes ) {
						// Can't use update_post_meta() because it doesn't allow revisions.
						update_metadata( 'post', $_gutenberg_revision_id, 'footnotes', $footnotes );
					}
				}
			}
		}
	);
}

add_action(
	'wp_restore_post_revision',
	/**
	 * Restores the footnotes meta value from the revision.
	 *
	 * @since 6.3.0
	 *
	 * @param int $post_id      The post ID.
	 * @param int $revision_id  The revision ID.
	 */
	static function( $post_id, $revision_id ) {
		$footnotes = get_post_meta( $revision_id, 'footnotes', true );

		if ( $footnotes ) {
			update_post_meta( $post_id, 'footnotes', $footnotes );
		} else {
			delete_post_meta( $post_id, 'footnotes' );
		}
	},
	10,
	2
);

add_filter(
	'_wp_post_revision_fields',
	/**
	 * Adds the footnotes field to the revision.
	 *
	 * @since 6.3.0
	 *
	 * @param array $fields The revision fields.
	 * @return array The revision fields.
	 */
	static function( $fields ) {
		$fields['footnotes'] = __( 'Footnotes' );
		return $fields;
	}
);

add_filter(
	'wp_post_revision_field_footnotes',
	/**
	 * Gets the footnotes field from the revision.
	 *
	 * @since 6.3.0
	 *
	 * @param string $revision_field The field value, but $revision->$field
	 *                               (footnotes) does not exist.
	 * @param string $field          The field name, in this case "footnotes".
	 * @param object $revision       The revision object to compare against.
	 * @return string The field value.
	 */
	static function( $revision_field, $field, $revision ) {
		return get_metadata( 'post', $revision->ID, $field, true );
	},
	10,
	3
);
