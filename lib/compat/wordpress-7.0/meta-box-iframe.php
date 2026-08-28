<?php
/**
 * Renders classic meta boxes in iframes under the block editor, by
 * trimming the classic edit screen down to the meta boxes when it is
 * requested through the meta box loader URL.
 *
 * @package gutenberg
 */

/**
 * Whether the current request renders meta boxes for the editor's iframe.
 * The loader nonce is verified by `use_block_editor_for_post()`.
 *
 * @return bool Whether this is a meta box iframe request.
 */
function gutenberg_is_meta_box_iframe_request() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return is_admin() && isset( $_GET['meta-box-loader'], $_GET['gutenberg-meta-box-iframe'] );
}

/**
 * Sends the same `Document-Isolation-Policy` header as the parent editor:
 * an isolated document can only script same-origin frames that are
 * isolated the same way.
 */
function gutenberg_meta_box_iframe_cross_origin_isolation() {
	if ( ! gutenberg_is_meta_box_iframe_request() ) {
		return;
	}

	// The post editor conditions of gutenberg_set_up_cross_origin_isolation().
	if (
		! function_exists( 'gutenberg_is_client_side_media_processing_enabled' ) ||
		! gutenberg_is_client_side_media_processing_enabled()
	) {
		return;
	}

	$user_id = get_current_user_id();
	if ( ! $user_id || ! user_can( $user_id, 'upload_files' ) ) {
		return;
	}

	gutenberg_start_cross_origin_isolation_output_buffer();
}
add_action( 'load-post.php', 'gutenberg_meta_box_iframe_cross_origin_isolation' );

/**
 * Returns which meta box locations the current iframe request renders.
 *
 * @return string[] The meta box locations to render.
 */
function gutenberg_meta_box_iframe_locations() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['gutenberg-meta-box-iframe'] ) && 'side' === $_GET['gutenberg-meta-box-iframe'] ) {
		return array( 'side' );
	}
	return array( 'normal', 'advanced' );
}

/**
 * Removes the locations other iframes render, and back-compat boxes,
 * which `do_meta_boxes()` only skips on block editor screens.
 */
function gutenberg_meta_box_iframe_remove_other_boxes() {
	global $wp_meta_boxes;

	if ( ! gutenberg_is_meta_box_iframe_request() || ! is_array( $wp_meta_boxes ) ) {
		return;
	}

	$rendered_locations = gutenberg_meta_box_iframe_locations();

	foreach ( $wp_meta_boxes as $screen_id => $locations ) {
		foreach ( $locations as $location => $priorities ) {
			if ( ! in_array( $location, $rendered_locations, true ) ) {
				unset( $wp_meta_boxes[ $screen_id ][ $location ] );
				continue;
			}
			foreach ( $priorities as $priority => $boxes ) {
				if ( ! is_array( $boxes ) ) {
					continue;
				}
				foreach ( $boxes as $box_id => $box ) {
					if (
						is_array( $box ) &&
						! empty( $box['args']['__back_compat_meta_box'] )
					) {
						unset( $wp_meta_boxes[ $screen_id ][ $location ][ $priority ][ $box_id ] );
					}
				}
			}
		}
	}
}
add_action( 'add_meta_boxes', 'gutenberg_meta_box_iframe_remove_other_boxes', PHP_INT_MAX );

/**
 * Skips rendering the meta boxes on the block editor page; the iframes
 * render them. The listing core would have computed from this array is
 * dispatched from the footer, after core dispatches the empty one.
 *
 * @param array $wp_meta_boxes Global meta box state.
 * @return array An empty array, so that nothing renders.
 */
function gutenberg_meta_box_iframe_remove_parent_boxes( $wp_meta_boxes ) {
	global $current_screen;

	if ( ! is_array( $wp_meta_boxes ) || ! $current_screen ) {
		return $wp_meta_boxes;
	}

	// The same computation as in the_block_editor_meta_boxes().
	$locations               = array( 'side', 'normal', 'advanced' );
	$priorities              = array( 'high', 'sorted', 'core', 'default', 'low' );
	$meta_boxes_per_location = array();
	foreach ( $locations as $location ) {
		$meta_boxes_per_location[ $location ] = array();

		if ( ! isset( $wp_meta_boxes[ $current_screen->id ][ $location ] ) ) {
			continue;
		}

		foreach ( $priorities as $priority ) {
			if ( ! isset( $wp_meta_boxes[ $current_screen->id ][ $location ][ $priority ] ) ) {
				continue;
			}

			$meta_boxes = (array) $wp_meta_boxes[ $current_screen->id ][ $location ][ $priority ];
			foreach ( $meta_boxes as $meta_box ) {
				if ( false === $meta_box || ! $meta_box['title'] ) {
					continue;
				}

				if ( ! empty( $meta_box['args']['__back_compat_meta_box'] ) ) {
					continue;
				}

				$meta_boxes_per_location[ $location ][] = array(
					'id'    => $meta_box['id'],
					'title' => $meta_box['title'],
				);
			}
		}
	}

	$script = 'window._wpLoadBlockEditor && window._wpLoadBlockEditor.then( function() {
		wp.data.dispatch( \'core/edit-post\' ).setAvailableMetaBoxesPerLocation( ' . wp_json_encode( $meta_boxes_per_location, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ' );
	} );';

	add_action(
		'admin_print_footer_scripts',
		function () use ( $script ) {
			printf( "<script>\n%s\n</script>\n", $script );
		},
		99
	);

	return array();
}
add_filter( 'filter_block_editor_meta_boxes', 'gutenberg_meta_box_iframe_remove_parent_boxes', PHP_INT_MAX );

/**
 * Removes scripts that only make sense when the classic screen is the editor.
 */
function gutenberg_meta_box_iframe_dequeue_scripts() {
	if ( ! gutenberg_is_meta_box_iframe_request() ) {
		return;
	}

	// The classic autosave would submit the hidden title and content fields.
	wp_dequeue_script( 'autosave' );

	// Scrolls the page for a content editor that the iframe does not show.
	wp_dequeue_script( 'editor-expand' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_meta_box_iframe_dequeue_scripts', PHP_INT_MAX );

/**
 * Prints a hidden submit button the editor saves the meta boxes with. It
 * skips constraint validation, which would abort on invalid fields in
 * hidden boxes, and the bootstrap cancels the submission itself.
 */
function gutenberg_meta_box_iframe_print_submitter() {
	if ( ! gutenberg_is_meta_box_iframe_request() ) {
		return;
	}
	echo '<button type="submit" id="gutenberg-meta-box-submitter" formnovalidate hidden></button>';
}
add_action( 'edit_form_top', 'gutenberg_meta_box_iframe_print_submitter' );

/**
 * Prints styles that trim the classic screen down to the meta boxes.
 */
function gutenberg_meta_box_iframe_print_styles() {
	if ( ! gutenberg_is_meta_box_iframe_request() ) {
		return;
	}
	$is_side = in_array( 'side', gutenberg_meta_box_iframe_locations(), true );
	?>
	<style id="gutenberg-meta-box-iframe-styles">
		#adminmenumain,
		#wpadminbar,
		#wpfooter,
		#screen-meta,
		#screen-meta-links,
		#post-body-content,
		.wrap > h1,
		.page-title-action,
		.wrap > .notice,
		.wrap > .updated,
		.wrap > .error,
		#lost-connection-notice {
			display: none !important;
		}
		html.wp-toolbar {
			padding-top: 0;
		}
		#wpcontent {
			margin-left: 0 !important;
			padding-left: 12px;
		}
		#wpbody-content {
			padding-bottom: 12px !important;
		}
		.wrap {
			margin: 12px 12px 0 0;
		}
		/* Stack the columns; each iframe provides a single column. */
		#poststuff {
			padding-top: 0;
			min-width: 0;
		}
		#poststuff #post-body.columns-2 {
			margin-right: 0;
		}
		#poststuff #post-body.columns-2 #postbox-container-1,
		#post-body #postbox-container-1 {
			float: none;
			margin-right: 0;
			width: auto;
		}
		#post-body #postbox-container-1 .meta-box-sortables {
			min-height: 0 !important;
			width: auto !important;
		}
		#post-body #postbox-container-1 .postbox {
			width: auto !important;
		}
		#post-body #postbox-container-2 {
			float: none;
			width: 100%;
		}
		<?php if ( $is_side ) : ?>
		/* The sidebar iframe sizes itself to its content, so the document
		 * height must follow the content instead of the viewport, and the
		 * desktop minimum widths must not apply at the sidebar width. */
		html,
		body {
			overflow: hidden;
			height: auto !important;
			min-height: 0 !important;
			min-width: 0 !important;
		}
		#wpcontent {
			padding-left: 0;
		}
		#wpbody-content {
			padding-bottom: 0 !important;
		}
		.wrap {
			margin: 12px;
		}
		<?php endif; ?>
	</style>
	<?php
}
add_action( 'admin_print_styles', 'gutenberg_meta_box_iframe_print_styles', 99 );

/**
 * Prints the script that adapts the classic screen to living in an
 * iframe, inline from meta-box-iframe.js so that it is not a registered
 * script anything can depend on.
 */
function gutenberg_meta_box_iframe_print_bootstrap() {
	if ( ! gutenberg_is_meta_box_iframe_request() ) {
		return;
	}
	wp_print_inline_script_tag(
		file_get_contents( __DIR__ . '/meta-box-iframe.js' ),
		array( 'id' => 'gutenberg-meta-box-iframe-bootstrap' )
	);
}
add_action( 'admin_head', 'gutenberg_meta_box_iframe_print_bootstrap', 100 );
