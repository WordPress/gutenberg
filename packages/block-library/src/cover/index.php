<?php
/**
 * Server-side rendering of the `core/cover` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/cover` block on server.
 *
 * @since 6.0.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the cover block markup, if useFeaturedImage is true.
 */
function render_block_core_cover( $attributes, $content ) {
	if ( 'image' !== $attributes['backgroundType'] || false === $attributes['useFeaturedImage'] ) {
		return $content;
	}

	if ( ! ( $attributes['hasParallax'] || $attributes['isRepeated'] ) ) {
		$attr = array(
			'class'           => 'wp-block-cover__image-background',
			'data-object-fit' => 'cover',
		);

		if ( isset( $attributes['focalPoint'] ) ) {
			$object_position              = round( $attributes['focalPoint']['x'] * 100 ) . '%' . ' ' . round( $attributes['focalPoint']['y'] * 100 ) . '%';
			$attr['data-object-position'] = $object_position;
			$attr['style']                = 'object-position:' . $object_position;
		}

		$image = get_the_post_thumbnail( null, 'post-thumbnail', $attr );
	} else {
		$image = '';
	}

	/*
	 * Inserts the featured image between the (1st) cover 'background' `span` and 'inner_container' `div`,
	 * and removes eventual withespace before the inner closing tag.
	 */
	$inner_container_start = '/<div\b[^>]+wp-block-cover__inner-container[\s|"][^>]*>/U';
	if ( 1 === preg_match( $inner_container_start, $content, $matches, PREG_OFFSET_CAPTURE ) ) {
		$offset  = $matches[0][1];
		$content = substr( $content, 0, $offset ) . $image . substr( $content, $offset );
	}

	return trim( $content );
}

/**
 * Registers the `core/cover` block renderer on server.
 *
 * @since 6.0.0
 */
function register_block_core_cover() {
	register_block_type_from_metadata(
		__DIR__ . '/cover',
		array(
			'render_callback' => 'render_block_core_cover',
		)
	);

	// Add inline script for sticky header detection on frontend only
	if ( ! is_admin() ) {
		// Register an empty script handle to attach inline script to
		wp_register_script(
			'wp-block-cover-view',
			'',
			array(),
			'1.0.0',
			array( 'in_footer' => true )
		);

		// Add inline script with sticky header detection logic
		$inline_script = <<<'JAVASCRIPT'
(function() {
	'use strict';
	
	/**
	 * Gets the total height of sticky Group blocks containing header template parts.
	 * 
	 * Improved detection logic:
	 * 1. Find all elements with position: sticky
	 * 2. Filter for .wp-block-group elements
	 * 3. Check if the Group contains a header template part (any of):
	 *    - .wp-block-template-part[data-area="header"]
	 *    - <header> element with .wp-block-template-part class
	 *    - Any .wp-block-template-part inside a sticky group (likely header)
	 */
	function getStickyHeaderHeight() {
		// Find all elements with position: sticky
		var allElements = document.querySelectorAll('*');
		var stickyElements = Array.from(allElements).filter(function(el) {
			var computed = window.getComputedStyle(el);
			return el.style.position === 'sticky' || 
			       el.classList.contains('is-position-sticky') ||
			       computed.position === 'sticky';
		});

		// Filter for Group blocks only
		var stickyGroups = stickyElements.filter(function(el) {
			return el.classList.contains('wp-block-group');
		});

		// Check each Group for header template parts with improved detection
		var stickyHeaders = stickyGroups.filter(function(group) {
			// Check for explicit header area attribute
			var hasExplicitHeader = group.querySelector('.wp-block-template-part[data-area="header"]');
			if (hasExplicitHeader) {
				return true;
			}

			// Check for header element (semantic HTML)
			var hasHeaderElement = group.querySelector('header.wp-block-template-part');
			if (hasHeaderElement) {
				return true;
			}

			// Check for any template part in a sticky group (likely a header if sticky)
			var hasAnyTemplatePart = group.querySelector('.wp-block-template-part');
			if (hasAnyTemplatePart) {
				return true;
			}

			return false;
		});

		if (stickyHeaders.length === 0) {
			return 0;
		}

		// Calculate total height of all sticky headers
		var totalHeight = 0;
		stickyHeaders.forEach(function(header) {
			var rect = header.getBoundingClientRect();
			var style = window.getComputedStyle(header);
			var marginTop = parseFloat(style.marginTop) || 0;
			var marginBottom = parseFloat(style.marginBottom) || 0;
			totalHeight += rect.height + marginTop + marginBottom;
		});

		return totalHeight;
	}

	/**
	 * Updates the CSS custom property with the current sticky header height.
	 */
	function updateStickyHeaderHeight() {
		var height = getStickyHeaderHeight();
		document.documentElement.style.setProperty('--wp-sticky-header-height', height + 'px');
	}

	/**
	 * Initialize on DOMContentLoaded
	 */
	function init() {
		updateStickyHeaderHeight();

		// Set up ResizeObserver to detect when elements are added/removed or resized
		if (typeof ResizeObserver !== 'undefined') {
			var resizeObserver = new ResizeObserver(updateStickyHeaderHeight);
			resizeObserver.observe(document.body);
		}

		// Also listen for window resize events
		window.addEventListener('resize', updateStickyHeaderHeight);
	}

	// Run on DOMContentLoaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
JAVASCRIPT;

		wp_add_inline_script(
			'wp-block-cover-view',
			$inline_script
		);

		// Enqueue the script (this will output the inline script)
		wp_enqueue_script( 'wp-block-cover-view' );
	}
}
add_action( 'init', 'register_block_core_cover' );
