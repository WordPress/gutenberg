<?php

/**
 * Print a wpInjectStylesheet function in <head>.
 * This will be used by blocks to print their styles on render.
 */
function gutenberg_print_inject_stylesheet_script() {
	if ( defined ( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
		?>
		<script id="wp-enqueue-style-script">
		function wpEnqueueStyle( handle, src, deps, ver, media ) {

			// Create the element.
			var stylePreload = document.createElement( 'link' ),
				style = document.createElement( 'link' ),
				isFirst = ! window.wpEnqueueStyleLastInjectedEl,
				injectEl = isFirst
					? document.head
					: document.getElementById( window.wpEnqueueStyleLastInjectedEl ),
				injectPos = isFirst
					? 'afterbegin'
					: 'afterend';

			// Add element props.
			stylePreload.id = handle + '-css';
			stylePreload.rel = 'preload';
			stylePreload.as = 'style';
			stylePreload.href = src;
			if ( ver ) {
				stylePreload.href += 0 < stylePreload.href.indexOf( '?' ) ? '&ver=' + ver : '?ver=' + ver;
			}
			stylePreload.media = media ? media : 'all';

			style.id = handle + '-css';
			style.rel = 'stylesheet';
			style.href = src;
			if ( ver ) {
				style.href += 0 < style.href.indexOf( '?' ) ? '&ver=' + ver : '?ver=' + ver;
			}
			style.media = media ? media : 'all';

			// Set the global var so we know where to add the next style.
			// This helps us preserve priorities and inject styles one after the other instead of reversed.
			window.wpEnqueueStyleLastInjectedEl = handle + '-css';

			// Inject the element.
			injectEl.insertAdjacentElement( injectPos, stylePreload );
			injectEl.insertAdjacentElement( injectPos, style );
		}
		</script>
		<?php
	} else {
		?>
		<script>function wpEnqueueStyle(e,n,t,l,d){var i=document.createElement("link"),o=document.createElement("link"),s=!window.t,c=s?document.head:document.getElementById(window.t),r=s?"afterbegin":"afterend";i.id=e+"-css";i.rel="preload";i.as="style";i.href=n;if(l){i.href+=0<i.href.indexOf("?")?"&ver="+l:"?ver="+l}i.media=d?d:"all";o.id=e+"-css";o.rel="stylesheet";o.href=n;if(l){o.href+=0<o.href.indexOf("?")?"&ver="+l:"?ver="+l}o.media=d?d:"all";window.t=e+"-css";c.insertAdjacentElement(r,i);c.insertAdjacentElement(r,o)}</script>
		<?php
	}

	// An array of block-styles that should be force-loaded first,
	// regardless of whether the block exists or not.
	// This helps avoid templates shifting.
	$force_load_styles = apply_filters(
		'force_load_block_styles',
		array(
			'core/columns' ,
		)
	);
	foreach ( $force_load_styles as $block_name ) {
		gutenberg_the_block_stylesheet_loading_script( $block_name );
	}
}
add_action( 'wp_head', 'gutenberg_print_inject_stylesheet_script', 1 );

/**
 * Injects a JS call to print the stylesheet for a block.
 *
 * @param string $block_content The block content about to be appended.
 * @param array  $block         The full block, including name and attributes.
 *
 * @return string
 */
function gutenberg_inject_block_stylesheet_loading_script( $block_content, $block ) {
	// We're using a global var to avoid adding the same thing multiple times.
	global $block_styles_injected_scripts;
	if ( ! $block_styles_injected_scripts ) {
		$block_styles_injected_scripts = array();
	}

	// Check if we've processed this block before or not.
	if ( isset( $block['blockName'] ) && ! in_array( $block['blockName'], $block_styles_injected_scripts ) ) {

		// Add the script.
		gutenberg_the_block_stylesheet_loading_script( $block['blockName'] );

		// Add the block-name to our global.
		$block_styles_injected_scripts[] = $block['blockName'];
	}
	return $block_content;
}
add_filter( 'render_block', 'gutenberg_inject_block_stylesheet_loading_script', 10, 2 );

/**
 * Prints the stylesheet injection script for a single block.
 *
 * @param string $block_name The block-name.
 *
 * @return void
 */
function gutenberg_the_block_stylesheet_loading_script( $block_name ) {

	// Get an array of stylesheets for this block.
	$styles = gutenberg_get_block_stylesheet_urls( $block_name );

	// Loop styles and inject them in <head>.
	foreach ( $styles as $style ) {
		$style = wp_parse_args(
			$style,
			[
				'handle' => '',
				'src'    => '',
				'ver'    => false,
			]
		);
		echo "<script>wpEnqueueStyle('{$style['handle']}', '{$style['src']}', [], '{$style['ver']}', '{$style['media']}')</script>";
	}
}

/**
 * Get an array of stylesheet URLs for a specific block.
 *
 * @param string $block_name The block-name.
 *
 * @return array
 */
function gutenberg_get_block_stylesheet_urls( $block_name ) {

	$core_block_styles = array(
		'audio',
		'button',
		'buttons',
		'calendar',
		'categories',
		'columns',
		'cover',
		'embed',
		'file',
		'gallery',
		'heading',
		'image',
		'latest-comments',
		'latest-posts',
		'list',
		'media-text',
		'navigation',
		'navigation-link',
		'paragraph',
		'post-author',
		'pullquote',
		'quote',
		'rss',
		'search',
		'separator',
		'site-logo',
		'social-links',
		'spacer',
		'subhead',
		'table',
		'text-columns',
		'video',
	);

	$stylesheets = array();
	foreach ( $core_block_styles as $block ) {
		$stylesheets[ "core/$block" ] = array(
			array(
				'handle' => "core-$block-block-styles",
				'src'    => gutenberg_url( "packages/block-library/build-style/$block.css" ),
				'ver'    => filemtime( gutenberg_dir_path() . "packages/block-library/build-style/$block.css" ),
				'media'  => 'all',
			),
		);
	}

	/**
	 * Filter collection of stylesheets per block-type.
	 *
	 * @since 5.5.0
	 *
	 * @param array $stylesheets An array of stylesheets per block-type.
	 */
	$stylesheets = apply_filters( 'block_styles_urls', $stylesheets );

	return isset( $stylesheets[ $block_name ] ) ? $stylesheets[ $block_name ] : array();
}
