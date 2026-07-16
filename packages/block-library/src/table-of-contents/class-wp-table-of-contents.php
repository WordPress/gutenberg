<?php
/**
 * WP_Table_Of_Contents class.
 *
 * @package WordPress
 */

/**
 * Internal utility class for the Table of Contents block.
 *
 * This class is for internal Core usage and is not supposed to be used by
 * extenders (plugins and/or themes).
 *
 * @access private
 */
final class WP_Table_Of_Contents {

	/**
	 * The Heading block's default level when no `level` attribute is saved.
	 *
	 * @var int
	 */
	private const DEFAULT_HEADING_LEVEL = 2;

	/**
	 * Utility class.
	 */
	private function __construct() {
	}

	/**
	 * Gets heading data for the Table of Contents block from a post.
	 *
	 * @param WP_Post $post       Post to scan.
	 * @param array   $attributes Attributes of the block being rendered.
	 *
	 * @return array Heading data.
	 */
	public static function get_headings_from_post( $post, $attributes ) {
		if ( ! $post instanceof WP_Post ) {
			return array();
		}

		$attributes = is_array( $attributes ) ? $attributes : array();
		$max_level  = isset( $attributes['maxLevel'] ) ? (int) $attributes['maxLevel'] : 0;
		// Heading context records the current pagination state so collection can
		// skip headings outside the rendered page and build page-aware links.
		$context = self::normalize_heading_context(
			$post->post_content,
			array(
				'only_include_current_page' => ! empty( $attributes['onlyIncludeCurrentPage'] ),
				'permalink'                 => get_permalink( $post ),
				'target_page'               => self::get_current_page_number(),
			)
		);

		return self::get_headings_from_content( $post->post_content, $max_level, $context );
	}

	/**
	 * Gets the link for a heading.
	 *
	 * Headings without an id cannot be linked. Non-paginated posts can use a local
	 * fragment link. Paginated posts need a full permalink so headings on later
	 * pages link to the correct page before applying the fragment.
	 *
	 * @param string $id      Heading id.
	 * @param array  $context Heading resolution context used while scanning the
	 *                        post content.
	 *
	 * @return string Heading link.
	 */
	private static function get_heading_link( $id, $context = array() ) {
		if ( '' === $id ) {
			return '';
		}

		if ( empty( $context['is_paginated'] ) || empty( $context['permalink'] ) ) {
			return '#' . $id;
		}

		$page      = isset( $context['current_page'] ) ? max( 1, (int) $context['current_page'] ) : 1;
		$permalink = remove_query_arg( 'page', $context['permalink'] );

		// Page 1 uses the canonical permalink, e.g. `/post/#intro`. Later pages use
		// the page query arg before the fragment, e.g. `/post/?page=2#details`.
		if ( 1 < $page ) {
			$permalink = add_query_arg( 'page', $page, $permalink );
		}

		return $permalink . '#' . $id;
	}

	/**
	 * Normalizes raw page break comments so the block processor can see them.
	 *
	 * Classic content can store page breaks as bare `<!--nextpage-->` markers, and
	 * the Page Break block also saves that marker as its inner content. Because
	 * `WP_Block_Processor` only advances through block comments, wrapping those
	 * markers as `core/nextpage` blocks lets the ToC count paginated post pages in
	 * the same pass that it scans headings.
	 *
	 * @param string $content Serialized block content.
	 *
	 * @return string Content with page breaks wrapped as nextpage blocks.
	 */
	private static function normalize_nextpage_blocks( $content ) {
		// Collapse already-wrapped nextpage blocks first so the replacement below
		// never nests a page break inside another nextpage wrapper.
		$content = preg_replace(
			'/<!--\s+wp:(?:core\/)?nextpage\s+-->\s*<!--nextpage-->\s*<!--\s+\/wp:(?:core\/)?nextpage\s+-->/',
			'<!--nextpage-->',
			$content
		);

		return str_replace(
			'<!--nextpage-->',
			'<!-- wp:nextpage --><!--nextpage--><!-- /wp:nextpage -->',
			$content
		);
	}

	/**
	 * Gets the heading data from a heading block.
	 *
	 * @param array $block     Parsed heading block.
	 * @param int   $max_level Maximum heading level to include.
	 * @param array $context   Heading resolution context.
	 *
	 * @return array|null Heading data, or null when the heading should be skipped.
	 */
	private static function get_heading_from_block( $block, $max_level, $context = array() ) {
		if ( ! is_array( $block ) ) {
			return null;
		}

		$level = isset( $block['attrs']['level'] )
			? (int) $block['attrs']['level']
			: self::DEFAULT_HEADING_LEVEL;

		if ( $max_level && $level > $max_level ) {
			return null;
		}

		$rendered_heading = render_block( $block );
		$processor        = new WP_HTML_Tag_Processor( $rendered_heading );
		$heading_tags     = array( 'H1', 'H2', 'H3', 'H4', 'H5', 'H6' );
		$id               = '';

		while ( $processor->next_tag() ) {
			if ( in_array( $processor->get_tag(), $heading_tags, true ) ) {
				$id = $processor->get_attribute( 'id' );
				break;
			}
		}

		if ( ! is_string( $id ) ) {
			$id = '';
		}

		$content = preg_replace( '/<br\s*\/?>/i', ' ', $rendered_heading );
		// Decode entities from rendered heading HTML before the ToC escapes them
		// once. Use html_entity_decode() because wp_specialchars_decode() only
		// handles special HTML characters, while headings can contain other named
		// entities.
		$content = html_entity_decode(
			trim( wp_strip_all_tags( $content ) ),
			ENT_QUOTES,
			get_option( 'blog_charset' )
		);

		if ( '' === $content ) {
			return null;
		}

		return array(
			'content' => $content,
			'level'   => $level,
			'link'    => self::get_heading_link( $id, $context ),
		);
	}

	/**
	 * Normalizes heading resolution context.
	 *
	 * The context is the shared state used while walking the current post content.
	 * It tracks whether the post is paginated, which page is being scanned, which
	 * page the rendered ToC should include, and which permalink should be used for
	 * page-aware heading links. Callers can pass partial context, so this helper
	 * fills defaults and normalizes booleans and page numbers before scanning.
	 *
	 * @param string $content Serialized block content.
	 * @param array  $context Heading resolution context.
	 *
	 * @return array Normalized heading resolution context.
	 */
	private static function normalize_heading_context( $content, $context = array() ) {
		$context = wp_parse_args(
			$context,
			array(
				'current_page'              => 1,
					'is_paginated'              => str_contains( $content, '<!--nextpage-->' ),
				'only_include_current_page' => false,
				'permalink'                 => '',
				'target_page'               => 1,
			)
		);

		return array(
			'current_page'              => max( 1, (int) $context['current_page'] ),
			'is_paginated'              => ! empty( $context['is_paginated'] ),
			'only_include_current_page' => ! empty( $context['only_include_current_page'] ),
			'permalink'                 => $context['permalink'],
			'target_page'               => max( 1, (int) $context['target_page'] ),
		);
	}

	/**
	 * Collects heading data from block content.
	 *
	 * @param string $content   Block content to scan.
	 * @param int    $max_level Maximum heading level to include.
	 * @param array  $context   Heading resolution context.
	 *
	 * @return array Heading data.
	 */
	private static function get_headings_from_content( $content, $max_level = 0, $context = array() ) {
		if ( ! class_exists( 'WP_Block_Processor' ) || '' === trim( $content ) ) {
			return array();
		}

		$content   = self::normalize_nextpage_blocks( $content );
		$context   = self::normalize_heading_context( $content, $context );
		$headings  = array();
		$processor = new WP_Block_Processor( $content );

		while ( $processor->next_block() ) {
			$block_type = $processor->get_block_type();

			if ( 'core/nextpage' === $block_type ) {
				++$context['current_page'];
				continue;
			}

			// `only_include_current_page` is the normalized form of the block's
			// `onlyIncludeCurrentPage` attribute. When false, headings from every
			// paginated page are included.
			$include_current_page = (
				empty( $context['only_include_current_page'] ) ||
				$context['current_page'] === $context['target_page']
			);

			if ( 'core/heading' !== $block_type || ! $include_current_page ) {
				continue;
			}

			$block   = $processor->extract_full_block_and_advance();
			$heading = self::get_heading_from_block( $block, $max_level, $context );

			if ( $heading ) {
				$headings[] = $heading;
			}
		}

		return $headings;
	}

	/**
	 * Gets the current page number for paginated post content.
	 *
	 * @return int Current page number.
	 */
	private static function get_current_page_number() {
		global $page;

		$current_page = (int) get_query_var( 'page' );
		if ( ! $current_page && isset( $page ) ) {
			$current_page = (int) $page;
		}

		return max( 1, $current_page );
	}
}
