<?php
/**
 * Media usage detection.
 *
 * Exposes whether an attachment is referenced anywhere on the site, so the
 * Media Library can help people find files that are safe to clean up.
 *
 * "Attached to" (the attachment's `post_parent`) only records where a file was
 * uploaded from, which is not the same as where it is used: a logo, a featured
 * image, or a file inserted into another post is routinely "unattached". This
 * class computes the stronger signal — a file is *used* when a post, template,
 * or pattern references it in its content, when it is a featured image, or when
 * it is the site logo or icon.
 *
 * Detection is conservative: any reference that can be found counts, so a file
 * is only reported as unused when no reference was found. Because a false
 * "unused" is what leads to deleting a file that is still shown, ambiguity is
 * resolved in favour of "used".
 *
 * @package gutenberg
 */

/**
 * Tracks which attachments are referenced somewhere on the site.
 *
 * The scan reads the whole library and every post's content, so its result is
 * memoized for the duration of a request: the per-item REST field and the
 * collection filter share a single pass. Call {@see self::flush_cache()} after
 * a write when a later read in the same request must observe it.
 *
 * @since 7.1.0
 */
class Gutenberg_Media_Usage {

	/**
	 * The memoized set of used attachment IDs, or `null` when not yet computed.
	 *
	 * @since 7.1.0
	 * @var int[]|null
	 */
	private static $used_attachment_ids = null;

	/**
	 * Which block attribute holds an attachment ID, keyed by block name.
	 *
	 * Read from the parsed block tree rather than from the serialized markup, so
	 * formatting differences in the comment delimiter cannot hide a reference.
	 *
	 * An explicit map rather than "any attribute called `id`": other core blocks
	 * also carry a numeric `id` that is not media — `core/navigation-link`,
	 * `core/navigation-submenu`, and `core/page-list-item` store a post or term
	 * ID, and term IDs live in their own sequence, so one can collide with an
	 * attachment ID. Reading the value out of a media block's known attribute
	 * avoids that.
	 *
	 * Mirrors MEDIA_ID_ATTRIBUTES in packages/editor/src/store/utils/
	 * attach-media-in-post/media-ids-in-blocks.js. Third-party blocks that embed
	 * media should register themselves through the
	 * `gutenberg_media_usage_media_id_attributes` filter.
	 *
	 * @since 7.1.0
	 * @var array<string, string>
	 */
	const MEDIA_ID_ATTRIBUTES = array(
		'core/image'          => 'id',
		'core/cover'          => 'id',
		'core/audio'          => 'id',
		'core/video'          => 'id',
		'core/file'           => 'id',
		'core/playlist-track' => 'id',
		'core/media-text'     => 'mediaId',
		'core/gallery'        => 'ids',
	);

	/**
	 * Returns the IDs of every attachment that is referenced somewhere.
	 *
	 * @since 7.1.0
	 *
	 * @return int[] Used attachment IDs, as integers.
	 */
	public static function get_used_attachment_ids() {
		if ( null === self::$used_attachment_ids ) {
			self::$used_attachment_ids = self::compute_used_attachment_ids();
		}

		return self::$used_attachment_ids;
	}

	/**
	 * Determines whether a single attachment is referenced somewhere on the site.
	 *
	 * @since 7.1.0
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return bool Whether the attachment is used.
	 */
	public static function is_used( $attachment_id ) {
		$attachment_id = (int) $attachment_id;

		if ( $attachment_id <= 0 ) {
			return false;
		}

		$used = in_array( $attachment_id, self::get_used_attachment_ids(), true );

		/**
		 * Filters whether a single attachment is considered used.
		 *
		 * @since 7.1.0
		 *
		 * @param bool $used          Whether the attachment is used.
		 * @param int  $attachment_id Attachment ID.
		 */
		return (bool) apply_filters( 'gutenberg_attachment_is_used', $used, $attachment_id );
	}

	/**
	 * Clears the memoized set, forcing the next read to recompute.
	 *
	 * @since 7.1.0
	 */
	public static function flush_cache() {
		self::$used_attachment_ids = null;
	}

	/**
	 * Returns the post types whose content is scanned for media references.
	 *
	 * Every post type is scanned except those that cannot hold a reference or
	 * that would only duplicate one: revisions and autosaves mirror the parent,
	 * menus hold links rather than content, and the remaining internal types are
	 * bookkeeping.
	 *
	 * @since 7.1.0
	 *
	 * @return string[] Scanned post type names.
	 */
	public static function get_scanned_post_types() {
		$post_types = array_keys( get_post_types( array(), 'names' ) );

		$excluded = array(
			'attachment',
			'revision',
			'nav_menu_item',
			'oembed_cache',
			'customize_changeset',
			'user_request',
		);

		/**
		 * Filters the post types scanned when detecting media usage.
		 *
		 * @since 7.1.0
		 *
		 * @param string[] $post_types Scanned post type names.
		 */
		return apply_filters(
			'gutenberg_media_usage_scanned_post_types',
			array_values( array_diff( $post_types, $excluded ) )
		);
	}

	/**
	 * Computes the IDs of every attachment that is referenced somewhere.
	 *
	 * A reference is any of:
	 * - an attachment ID in a block attribute (see MEDIA_ID_ATTRIBUTES);
	 * - a `wp-image-<id>` or `wp-attachment-<id>` marker in post content;
	 * - a `[gallery ids="…"]` shortcode in post content;
	 * - the attachment's URL appearing in post content;
	 * - the attachment being a featured image of a post;
	 * - the attachment being the site logo, site icon, or classic-theme logo.
	 *
	 * @since 7.1.0
	 *
	 * @return int[] Used attachment IDs, as integers.
	 */
	private static function compute_used_attachment_ids() {
		global $wpdb;

		$used = array();

		// Index the library once: a map from each attachment's URL to its ID, so
		// URL references found in content resolve without a query per URL, and a
		// set of the attachment IDs, so a numeric block attribute from another
		// sequence (a post or term ID in `core/navigation-link`, say) is not
		// mistaken for a media reference.
		$url_map        = array();
		$attachment_ids = array();
		$url_rows       = $wpdb->get_results(
			"SELECT ID, guid FROM {$wpdb->posts} WHERE post_type = 'attachment'"
		);
		foreach ( $url_rows as $row ) {
			$attachment_ids[ (int) $row->ID ] = true;
			if ( '' !== $row->guid ) {
				$url_map[ $row->guid ] = (int) $row->ID;
			}
		}

		$post_types = self::get_scanned_post_types();
		$attributes = self::get_media_id_attributes();

		if ( ! empty( $post_types ) ) {
			$placeholders = implode( ', ', array_fill( 0, count( $post_types ), '%s' ) );
			$query        = "SELECT post_content FROM {$wpdb->posts}
				 WHERE post_type IN ( $placeholders )
				   AND post_status NOT IN ( 'auto-draft', 'trash' )
				   AND post_content != ''";
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Prepared on the next line.
			$contents = $wpdb->get_col( $wpdb->prepare( $query, $post_types ) );

			foreach ( $contents as $content ) {
				foreach ( parse_blocks( $content ) as $block ) {
					self::collect_ids_from_block( $block, $used, $attributes, $attachment_ids, $url_map );
				}
			}
		}

		// Featured images.
		$thumbnail_ids = $wpdb->get_col(
			"SELECT DISTINCT meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_thumbnail_id'"
		);
		foreach ( $thumbnail_ids as $id ) {
			$used[] = (int) $id;
		}

		// Site logo and site icon.
		foreach ( array( 'site_logo', 'site_icon' ) as $option ) {
			$id = (int) get_option( $option );
			if ( $id > 0 ) {
				$used[] = $id;
			}
		}

		// Classic-theme logo.
		$custom_logo = (int) get_theme_mod( 'custom_logo' );
		if ( $custom_logo > 0 ) {
			$used[] = $custom_logo;
		}

		$used = array_values( array_unique( array_filter( $used ) ) );

		/**
		 * Filters the IDs of attachments detected as used.
		 *
		 * @since 7.1.0
		 *
		 * @param int[] $used Used attachment IDs.
		 */
		$used = apply_filters( 'gutenberg_used_attachment_ids', $used );

		return array_values( array_unique( array_map( 'intval', $used ) ) );
	}

	/**
	 * Returns the block-to-attribute map used when detecting media usage.
	 *
	 * @since 7.1.0
	 *
	 * @return array<string, string> Block name to attribute name.
	 */
	private static function get_media_id_attributes() {
		/**
		 * Filters the block-attribute map used when detecting media usage.
		 *
		 * Blocks that embed media and hold its ID in a single attribute can add
		 * themselves, so their attachments are not reported as unused.
		 *
		 * @since 7.1.0
		 *
		 * @param array<string, string> $attributes Block name to attribute name.
		 */
		return apply_filters( 'gutenberg_media_usage_media_id_attributes', self::MEDIA_ID_ATTRIBUTES );
	}

	/**
	 * Collects every attachment ID referenced by a block and its descendants.
	 *
	 * @since 7.1.0
	 *
	 * @param array               $block      A parsed block.
	 * @param int[]               $used       Used attachment IDs, appended to.
	 * @param array<string,string> $attributes Block name to media ID attribute name.
	 * @param bool[]              $attachment_ids Attachment IDs as keys, used to
	 *                                          confirm a candidate names a real
	 *                                          attachment.
	 * @param string[]            $url_map    Attachment URL to ID map.
	 */
	private static function collect_ids_from_block( array $block, array &$used, array $attributes, array $attachment_ids, array $url_map ) {
		$block_name = $block['blockName'] ?? '';
		$attribute  = $attributes[ $block_name ] ?? null;

		if ( $attribute && ! empty( $block['attrs'][ $attribute ] ) ) {
			foreach ( (array) $block['attrs'][ $attribute ] as $value ) {
				if ( is_numeric( $value ) && isset( $attachment_ids[ (int) $value ] ) ) {
					$used[] = (int) $value;
				}
			}
		}

		if ( ! empty( $block['innerHTML'] ) ) {
			self::collect_ids_from_html( $block['innerHTML'], $used, $attachment_ids, $url_map );
		}

		foreach ( $block['innerBlocks'] as $inner_block ) {
			self::collect_ids_from_block( $inner_block, $used, $attributes, $attachment_ids, $url_map );
		}
	}

	/**
	 * Collects attachment IDs referenced by rendered HTML.
	 *
	 * Covers classic markup that predates blocks: the `wp-image-<id>` class and
	 * `wp-attachment-<id>` id WordPress adds to inserted images, the `[gallery]`
	 * shortcode, and plain attachment URLs. Each candidate is confirmed against
	 * the library so a stray number is not mistaken for a reference.
	 *
	 * @since 7.1.0
	 *
	 * @param string   $html           The HTML to scan.
	 * @param int[]    $used           Used attachment IDs, appended to.
	 * @param bool[]   $attachment_ids Attachment IDs as keys.
	 * @param string[] $url_map        Attachment URL to ID map.
	 */
	private static function collect_ids_from_html( $html, array &$used, array $attachment_ids, array $url_map ) {
		if ( preg_match_all( '/wp-(?:image|attachment)-(\d+)/', $html, $matches ) ) {
			foreach ( $matches[1] as $id ) {
				if ( isset( $attachment_ids[ (int) $id ] ) ) {
					$used[] = (int) $id;
				}
			}
		}

		if ( preg_match_all( '/\[gallery[^\]]*\bids\s*=\s*["\']([\d,\s]+)["\']/i', $html, $matches ) ) {
			foreach ( $matches[1] as $id_list ) {
				foreach ( preg_split( '/[\s,]+/', trim( $id_list ) ) as $id ) {
					if ( is_numeric( $id ) && isset( $attachment_ids[ (int) $id ] ) ) {
						$used[] = (int) $id;
					}
				}
			}
		}

		if ( empty( $url_map ) || false === strpos( $html, '/wp-content/uploads/' ) ) {
			return;
		}

		if ( preg_match_all( '#https?://[^\s"\'<>\)]+#i', $html, $matches ) ) {
			foreach ( $matches[0] as $url ) {
				$url = strtok( $url, '?' );
				if ( isset( $url_map[ $url ] ) ) {
					$used[] = $url_map[ $url ];
				}
			}
		}
	}
}

/**
 * Registers the `used` REST field on attachments.
 *
 * The field is only computed when the request actually asks about usage —
 * either the `used` collection filter, or the `include_used` flag the Media
 * Library sends when the "Usage" column is visible. Detecting usage reads every
 * post's content, so leaving the field `null` on other attachment responses
 * keeps ordinary browsing and the editor's media modal from paying for it.
 */
function gutenberg_media_usage_register_rest_field() {
	register_rest_field(
		'attachment',
		'used',
		array(
			'schema'       => array(
				'description' => __( 'Whether the attachment is referenced somewhere on the site. Null when the request did not ask about usage.', 'gutenberg' ),
				'type'        => array( 'boolean', 'null' ),
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
			'get_callback' => static function ( $post, $field_name, $request ) {
				if ( null === $request->get_param( 'used' ) && ! $request->get_param( 'include_used' ) ) {
					return null;
				}

				return Gutenberg_Media_Usage::is_used( $post['id'] );
			},
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_media_usage_register_rest_field' );

/**
 * Adds the `used` and `include_used` collection parameters to attachments.
 *
 * `used` filters the collection, `include_used` asks for the computed `used`
 * field without filtering (the "Usage" column without a usage filter).
 *
 * @param array $params Collection parameters.
 * @return array Modified collection parameters.
 */
function gutenberg_media_usage_add_collection_params( $params ) {
	$params['used'] = array(
		'description' => __( 'Limit result set to attachments that are used or unused somewhere on the site.', 'gutenberg' ),
		'type'        => 'boolean',
		'default'     => null,
	);

	$params['include_used'] = array(
		'description' => __( 'Include the computed `used` field on each attachment. Detecting usage scans the site content, so it is only done on request.', 'gutenberg' ),
		'type'        => 'boolean',
		'default'     => false,
	);

	return $params;
}
add_filter( 'rest_attachment_collection_params', 'gutenberg_media_usage_add_collection_params' );

/**
 * Filters the attachment query to honour the `used` collection parameter.
 *
 * @param array           $args    Query arguments.
 * @param WP_REST_Request $request The REST request.
 * @return array Modified query arguments.
 */
function gutenberg_media_usage_filter_attachment_query( $args, $request ) {
	$used = $request->get_param( 'used' );

	if ( null === $used ) {
		return $args;
	}

	$used_ids = Gutenberg_Media_Usage::get_used_attachment_ids();

	if ( rest_sanitize_boolean( $used ) ) {
		// `post__in` with an empty list matches everything in WP_Query, so
		// substitute an impossible ID to match nothing.
		$args['post__in'] = ! empty( $used_ids ) ? $used_ids : array( 0 );
	} else {
		$args['post__not_in'] = $used_ids;
	}

	return $args;
}
add_filter( 'rest_attachment_query', 'gutenberg_media_usage_filter_attachment_query', 10, 2 );

/**
 * Invalidates the cached usage set when content that can reference media
 * changes.
 *
 * The cache lives for one request, so this only matters within a request that
 * writes and then reads; hooking the writes keeps that read honest. Mirrors
 * `_gutenberg_clean_theme_json_caches()`.
 */
function _gutenberg_clean_media_usage_cache() {
	Gutenberg_Media_Usage::flush_cache();
}

add_action( 'save_post', '_gutenberg_clean_media_usage_cache' );
add_action( 'deleted_post', '_gutenberg_clean_media_usage_cache' );
add_action( 'added_post_meta', '_gutenberg_clean_media_usage_cache' );
add_action( 'updated_post_meta', '_gutenberg_clean_media_usage_cache' );
add_action( 'deleted_post_meta', '_gutenberg_clean_media_usage_cache' );
add_action( 'updated_option', '_gutenberg_clean_media_usage_cache' );
add_action( 'added_option', '_gutenberg_clean_media_usage_cache' );
add_action( 'deleted_option', '_gutenberg_clean_media_usage_cache' );
