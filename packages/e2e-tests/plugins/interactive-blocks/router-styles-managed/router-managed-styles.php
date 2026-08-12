<?php
/**
 * Simulates the server-side marking of style assets managed by the
 * Interactivity API router.
 *
 * WordPress core marks every `<style>` and `<link rel="stylesheet">` element
 * it renders with an empty `data-wp-router-managed` attribute, so the router
 * can tell them apart from the style assets injected at runtime by scripts
 * unaware of it. That feature is not available in the WordPress version
 * bundled with `wp-env`, so this file reproduces it with an output buffer for
 * those pages containing the `test/router-styles-managed` block.
 *
 * @package gutenberg-test-interactive-blocks
 */

/**
 * Adds the `data-wp-router-managed` attribute to every style asset in the
 * passed HTML.
 *
 * Style elements inside `<noscript>` are skipped, as they are not rendered by
 * the server-side implementation either.
 *
 * @param string $html Full HTML of the page.
 * @return string HTML with all the style assets marked.
 */
function gutenberg_test_mark_router_managed_styles( $html ) {
	if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
		return $html;
	}

	$processor   = new WP_HTML_Tag_Processor( $html );
	$in_noscript = false;

	while ( $processor->next_tag( array( 'tag_closers' => 'visit' ) ) ) {
		$tag = $processor->get_tag();

		if ( 'NOSCRIPT' === $tag ) {
			$in_noscript = ! $processor->is_tag_closer();
			continue;
		}

		if ( $in_noscript || $processor->is_tag_closer() ) {
			continue;
		}

		if ( 'STYLE' === $tag ) {
			$processor->set_attribute( 'data-wp-router-managed', true );
		} elseif ( 'LINK' === $tag ) {
			$rel = $processor->get_attribute( 'rel' );
			if (
				is_string( $rel ) &&
				in_array(
					'stylesheet',
					preg_split( '/\s+/', strtolower( trim( $rel ) ) ),
					true
				)
			) {
				$processor->set_attribute( 'data-wp-router-managed', true );
			}
		}
	}

	return $processor->get_updated_html();
}

add_action(
	'template_redirect',
	function () {
		if ( ! is_singular() ) {
			return;
		}

		$post = get_post();

		if (
			! $post instanceof WP_Post ||
			! has_block( 'test/router-styles-managed', $post )
		) {
			return;
		}

		/*
		 * The buffer is not explicitly ended. PHP flushes it at the end of the
		 * request, calling the passed callback with the full page HTML.
		 */
		ob_start( 'gutenberg_test_mark_router_managed_styles' );
	}
);
