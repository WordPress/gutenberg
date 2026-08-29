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
 * Renders the loader page: an admin iframe document with only the post
 * form and the requested meta boxes, reusing the same core functions the
 * classic edit screen is built from.
 *
 * @param bool    $replace Whether the editor is already replaced.
 * @param WP_Post $post    The post being edited.
 * @return bool Whether the editor is replaced.
 */
function gutenberg_meta_box_iframe_render_page( $replace, $post ) {
	if ( ! gutenberg_is_meta_box_iframe_request() ) {
		return $replace;
	}

	// WP_Screen::get() applies this filter while the current screen is
	// still being set up; render on the later call from post.php.
	if ( ! get_current_screen() ) {
		return true;
	}

	require_once ABSPATH . 'wp-admin/includes/meta-boxes.php';
	register_and_do_post_meta_boxes( $post );

	wp_enqueue_style( 'wp-admin' );
	wp_enqueue_style( 'colors' );
	wp_enqueue_script( 'post' );
	wp_enqueue_media( array( 'post' => $post ) );

	iframe_header();
	?>
	<form name="post" action="post.php" method="post" id="post">
		<button type="submit" id="gutenberg-meta-box-submitter" formnovalidate hidden></button>
		<?php
		the_block_editor_meta_box_post_form_hidden_fields( $post );
		foreach ( gutenberg_meta_box_iframe_locations() as $location ) {
			do_meta_boxes( get_current_screen(), $location, $post );
		}
		?>
	</form>
	<?php
	iframe_footer();
	exit;
}
add_filter( 'replace_editor', 'gutenberg_meta_box_iframe_render_page', 10, 2 );

/**
 * Prints styles that adapt the loader page to its iframe.
 */
function gutenberg_meta_box_iframe_print_styles() {
	if ( ! gutenberg_is_meta_box_iframe_request() ) {
		return;
	}
	$is_side = in_array( 'side', gutenberg_meta_box_iframe_locations(), true );
	?>
	<style id="gutenberg-meta-box-iframe-styles">
		body.iframe {
			margin: 12px;
		}
		.meta-box-sortables {
			min-height: 0 !important;
		}
		<?php if ( $is_side ) : ?>
		/* The sidebar iframe sizes itself to its content. */
		html,
		body.iframe {
			overflow: hidden;
			height: auto !important;
			min-height: 0 !important;
			min-width: 0 !important;
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
