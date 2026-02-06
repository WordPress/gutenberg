<?php
/**
 * Server-side rendering of the `core/file` block.
 *
 * @package WordPress
 */

/**
 * When the `core/file` block is rendering, check if we need to enqueue the `wp-block-file-view` script.
 *
 * @since 5.8.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 *
 * @return string Returns the block content.
 */
function render_block_core_file( $attributes, $content ) {
	$href             = $attributes['href'] ?? '';
	$display_preview  = $attributes['displayPreview'] ?? false;
	$preview_height   = $attributes['previewHeight'] ?? 600;
	$file_name        = $attributes['fileName'] ?? '';
	$is_pdf           = false;

	// Use transient memory to ensure the validation logic only runs once per block.
	// This will prevent the `unfiltered_html` check from failing on the second pass.
	$transient_name = 'core_file_is_pdf_' . md5( $href );
	$is_pdf         = get_transient( $transient_name );

	if ( false === $is_pdf ) {
		// Verify if the file is a PDF.
		if ( ! empty( $href ) ) {
			$file_ext = pathinfo( parse_url( $href, PHP_URL_PATH ), PATHINFO_EXTENSION );
			if ( 'pdf' === strtolower( $file_ext ) ) {
				$is_pdf = true;
			}
		}
		set_transient( $transient_name, $is_pdf, DAY_IN_SECONDS );
	}

	if ( ! $display_preview || ! $is_pdf ) {
		return $content;
	}

	// If it's interactive, enqueue the script module and add the directives.
	wp_enqueue_script_module( '@wordpress/block-library/file/view' );

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag();
	$processor->set_attribute( 'data-wp-interactive', 'core/file' );
	$content = $processor->get_updated_html();

	// If there is no object tag but we should have one, reconstruct.
	if ( ! $processor->next_tag( 'OBJECT' ) ) {
		// If the object tag is missing (e.g., stripped for authors), we need to reconstruct it.
		// We look for the placeholder div rendered by save.js.

		$processor = new WP_HTML_Tag_Processor( $content );
		if ( $processor->next_tag( array( 'class_name' => 'wp-block-file__embed' ) ) ) {
			// Found the placeholder.
			$label = $file_name ? sprintf( __( 'Embed of %s.' ), $file_name ) : __( 'PDF embed' );

			$processor->set_attribute( 'data', $href );
			$processor->set_attribute( 'type', 'application/pdf' );
			$processor->set_attribute( 'style', 'width:100%;height:' . $preview_height . 'px' );
			$processor->set_attribute( 'aria-label', $label );
			
			// Prepare the object tag HTML. The placeholder div will be replaced later
			// since WP_HTML_Tag_Processor cannot change tag names.
			
			// Let's reconstruct the object HTML string.
			$object_html = sprintf(
				'<object className="wp-block-file__embed" data="%s" type="application/pdf" style="width:100%%;height:%spx" aria-label="%s"></object>',
				esc_url( $href ),
				esc_attr( $preview_height ),
				esc_attr( $label )
			);
			
			// The save.js renders a DIV with `dangerouslySetInnerHTML`.
			// We replace the placeholder div with the object tag using regex because
			// WP_HTML_Tag_Processor doesn't support replacing tags or setting inner HTML.
			
			$label = $file_name ? sprintf( __( 'Embed of %s.' ), $file_name ) : __( 'PDF embed' );
			$object_html = sprintf(
				'<object class="wp-block-file__embed" data="%s" type="application/pdf" style="width:100%%;height:%spx" aria-label="%s"></object>',
				esc_url( $href ),
				esc_attr( $preview_height ),
				esc_attr( $label )
			);
			
			// We replace the placeholder div with the object tag.
			// The placeholder is `<div class="wp-block-file__embed"></div>` roughly.
			// We use a regex that is flexible with whitespace and attributes.
			// Class is the constant anchor.
			
			$content = preg_replace(
				'/<div[^>]*class="[^"]*wp-block-file__embed[^"]*"[^>]*>\s*<\/div>/',
				$object_html,
				$content,
				1
			);
		}
	}
	
	// Re-run the processor to add interactivity attributes if needed, as we might have just injected the object.
	$processor = new WP_HTML_Tag_Processor( $content );
	if ( $processor->next_tag( 'OBJECT' ) ) {
		$processor->set_attribute( 'data-wp-bind--hidden', '!state.hasPdfPreview' );
		$processor->set_attribute( 'hidden', true );
		
		// Ensure aria-label is correct (handling legacy/translation issues)
		$label        = $file_name ? sprintf(
			/* translators: %s: filename. */
			__( 'Embed of %s.' ),
			$file_name
		) : __( 'PDF embed' );
		
		$processor->set_attribute( 'aria-label', $label );
	}

	return $processor->get_updated_html();
}

/**
 * Registers the `core/file` block on server.
 *
 * @since 5.8.0
 */
function register_block_core_file() {
	register_block_type_from_metadata(
		__DIR__ . '/file',
		array(
			'render_callback' => 'render_block_core_file',
		)
	);
}
add_action( 'init', 'register_block_core_file' );
