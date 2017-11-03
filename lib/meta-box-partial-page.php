<?php
/**
 * Initialization and wp-admin integration for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Renders a partial page of meta boxes.
 *
 * @since 1.5.0
 *
 * @param string $post_type Current post type.
 * @param string $meta_box_context  The context location of the meta box. Referred to as context in core.
 */
function gutenberg_meta_box_partial_page( $post_type, $meta_box_context ) {
	/**
	 * Needs classic editor to be active.
	 *
	 * @see https://github.com/WordPress/gutenberg/commit/bdf94e65ac0c10b3ce5d8e214f0c9e1081997d9b
	 */
	if ( ! isset( $_REQUEST['classic-editor'] ) ) {
		return;
	}

	/**
	 * The meta_box param as long as it is set on the wp-admin/post.php request
	 * will trigger this partial page.
	 *
	 * Essentially all that happens is we try to load in the scripts from admin_head
	 * and admin_footer to mimic the assets for a typical post.php.
	 *
	 * @in_the_future Hopefully the meta box param can be changed to a location,
	 * or contenxt, so that we can use this API to render meta boxes that appear,
	 * in the sidebar vs. regular content, or core meta boxes vs others. For now
	 * a request like http://local.wordpress.dev/wp-admin/post.php?post=40007&action=edit&meta_box=taco
	 * works just fine!
	 */
	if ( ! isset( $_REQUEST['meta_box'] ) || 'post.php' !== $GLOBALS['pagenow'] ) {
		return;
	}

	/**
	 * Prevent over firing of the meta box rendering.
	 *
	 * The hook do_action( 'do_meta_boxes', ... ) fires three times in
	 * edit-form-advanced.php
	 *
	 * To make sure we properly fire on all three meta box locations, except
	 * advanced, as advanced is tied in with normal for ease of use reasons, we
	 * need to verify that the action location/context matches our requests
	 * meta box location/context. We then exit early if they do not match.
	 * This will prevent execution thread from dieing, so the subsequent calls
	 * to do_meta_boxes can fire.
	 */
	if ( $_REQUEST['meta_box'] !== $meta_box_context ) {
		return;
	}

	$location = $_REQUEST['meta_box'];

	if ( ! in_array( $_REQUEST['meta_box'], array( 'side', 'normal', 'advanced' ) ) ) {
		wp_die( __( 'The `meta_box` parameter should be one of "side", "normal", or "advanced".', 'gutenberg' ) );
	}

	global $post, $wp_meta_boxes, $hook_suffix, $current_screen, $wp_locale;

	gutenberg_meta_box_partial_page_admin_header( $hook_suffix, $current_screen, $wp_locale );

	gutenberg_meta_box_partial_page_post_form( $post, $location );

	// Handle meta box state.
	$_original_meta_boxes = $wp_meta_boxes;

	/**
	 * Fires right before the meta boxes are rendered.
	 *
	 * This allows for the filtering of meta box data, that should already be
	 * present by this point. Do not use as a means of adding meta box data.
	 *
	 * By default gutenberg_filter_meta_boxes() is hooked in and can be
	 * unhooked to restore core meta boxes.
	 *
	 * @param array $wp_meta_boxes Global meta box state.
	 */
	$wp_meta_boxes = apply_filters( 'filter_gutenberg_meta_boxes', $wp_meta_boxes );

	// Exit early if the meta box is empty. Send out a post message to tell React to not render meta boxes.
	if ( gutenberg_is_meta_box_empty( $wp_meta_boxes, $_REQUEST['meta_box'], $post->post_type ) ) {
		exit();
	}

	$locations = array();

	// Lump normal and advanced in together for now. Advanced usually appears after title.
	if ( 'normal' === $_REQUEST['meta_box'] || 'advanced' === $_REQUEST['meta_box'] ) {
		$locations = array( 'advanced', 'normal' );
	}

	if ( 'side' === $_REQUEST['meta_box'] ) {
		$locations = array( 'side' );
	}

	// Render meta boxes.
	if ( ! empty( $locations ) ) {
		foreach ( $locations as $location ) {
			do_meta_boxes(
				$current_screen,
				$location,
				$post
			);
		}
	}

	// Reset meta box data.
	$wp_meta_boxes = $_original_meta_boxes;

	gutenberg_meta_box_partial_page_admin_footer( $hook_suffix );

	/**
	 * Shutdown hooks potentially firing.
	 *
	 * Try Query Monitor plugin to make sure the output isn't janky.
	 */
	remove_all_actions( 'shutdown' );
	exit();
}

add_action( 'do_meta_boxes', 'gutenberg_meta_box_partial_page', 1000, 2 );

/**
 * The partial page needs to imitate aspects of admin-header.php.
 *
 * See wp-admin/admin-header.php at around line 70.
 *
 * @since 1.5.0
 *
 * @param string    $hook_suffix    Page hook suffix.
 * @param WP_Screen $current_screen Current screen object.
 * @param WP_Locale $wp_locale      Locale object.
 */
function gutenberg_meta_box_partial_page_admin_header( $hook_suffix, $current_screen, $wp_locale ) {
	/* Scripts and styles that meta boxes can potentially be using */
	wp_enqueue_style( 'common' );
	wp_enqueue_style( 'buttons' );
	wp_enqueue_style( 'colors' );
	wp_enqueue_style( 'ie' );

	wp_enqueue_script( 'utils' );
	wp_enqueue_script( 'common' );
	wp_enqueue_script( 'svg-painter' );

	// These assets are Gutenberg specific.
	wp_enqueue_style(
		'meta-box-gutenberg',
		gutenberg_url( 'editor/build/meta-box-iframe.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'editor/build/meta-box-iframe.css' )
	);

	wp_enqueue_script(
		'meta-box-resize',
		gutenberg_url( 'assets/js/meta-box-resize.js' ),
		array(),
		filemtime( gutenberg_dir_path() . 'assets/js/meta-box-resize.js' ),
		true
	);

	// Grab the admin body class.
	$admin_body_class = preg_replace( '/[^a-z0-9_-]+/i', '-', $hook_suffix );

	?>
	<!-- Add an html class so that scroll bars can be removed in css and make it appear as though the iframe is one with Gutenberg. -->
	<html class="gutenberg-meta-box-html">
	<head>
	<!-- Add in JavaScript variables that some meta box plugins make use of. -->
	<script type="text/javascript">
	addLoadEvent = function( func ){ if( typeof jQuery!="undefined" )jQuery( document ).ready( func );else if(typeof wpOnload!='function'){wpOnload=func;}else{var oldonload=wpOnload;wpOnload=function(){oldonload();func();}}};
	var ajaxurl = '<?php echo admin_url( 'admin-ajax.php', 'relative' ); ?>',
		pagenow = '<?php echo $current_screen->id; ?>',
		typenow = '<?php echo $current_screen->post_type; ?>',
		adminpage = '<?php echo $admin_body_class; ?>',
		thousandsSeparator = '<?php echo addslashes( $wp_locale->number_format['thousands_sep'] ); ?>',
		decimalPoint = '<?php echo addslashes( $wp_locale->number_format['decimal_point'] ); ?>',
		isRtl = <?php echo (int) is_rtl(); ?>;
	</script>
	<meta name="viewport" content="width=device-width,initial-scale=1.0">
	<?php

	/**
	 * Enqueue scripts for all admin pages.
	 *
	 * @since wp-core 2.8.0
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	do_action( 'admin_enqueue_scripts', $hook_suffix );

	/**
	 * Fires when styles are printed for a specific admin page based on $hook_suffix.
	 *
	 * @since wp-core 2.6.0
	 */
	// @codingStandardsIgnoreStart
	do_action( "admin_print_styles-{$hook_suffix}" );
	// @codingStandardsIgnoreEnd

	/**
	 * Fires when styles are printed for all admin pages.
	 *
	 * @since wp-core 2.6.0
	 */
	do_action( 'admin_print_styles' );

	/**
	 * Fires when scripts are printed for a specific admin page based on $hook_suffix.
	 *
	 * @since wp-core 2.1.0
	 */
	// @codingStandardsIgnoreStart
	do_action( "admin_print_scripts-{$hook_suffix}" );
	// @codingStandardsIgnoreEnd

	/**
	 * Fires when scripts are printed for all admin pages.
	 *
	 * @since wp-core 2.1.0
	 */
	do_action( 'admin_print_scripts' );

	/**
	 * Fires in head section for a specific admin page.
	 *
	 * The dynamic portion of the hook, `$hook_suffix`, refers to the hook suffix
	 * for the admin page.
	 *
	 * @since wp-core 2.1.0
	 */
	// @codingStandardsIgnoreStart
	do_action( "admin_head-{$hook_suffix}" );
	// @codingStandardsIgnoreEnd

	/**
	 * Fires in head section for all admin pages.
	 *
	 * @since wp-core 2.1.0
	 */
	do_action( 'admin_head' );

	/**
	 * The main way post.php sets body class.
	 */
	if ( get_user_setting( 'mfold' ) == 'f' ) {
		$admin_body_class .= ' folded';
	}

	if ( ! get_user_setting( 'unfold' ) ) {
		$admin_body_class .= ' auto-fold';
	}

	if ( is_admin_bar_showing() ) {
		$admin_body_class .= ' admin-bar';
	}

	if ( is_rtl() ) {
		$admin_body_class .= ' rtl';
	}

	if ( $current_screen->post_type ) {
		$admin_body_class .= ' post-type-' . $current_screen->post_type;
	}

	if ( $current_screen->taxonomy ) {
		$admin_body_class .= ' taxonomy-' . $current_screen->taxonomy;
	}

	$admin_body_class .= ' branch-' . str_replace( array( '.', ',' ), '-', floatval( get_bloginfo( 'version' ) ) );
	$admin_body_class .= ' version-' . str_replace( '.', '-', preg_replace( '/^([.0-9]+).*/', '$1', get_bloginfo( 'version' ) ) );
	$admin_body_class .= ' admin-color-' . sanitize_html_class( get_user_option( 'admin_color' ), 'fresh' );
	$admin_body_class .= ' locale-' . sanitize_html_class( strtolower( str_replace( '_', '-', get_user_locale() ) ) );

	if ( wp_is_mobile() ) {
		$admin_body_class .= ' mobile';
	}

	if ( is_multisite() ) {
		$admin_body_class .= ' multisite';
	}

	if ( is_network_admin() ) {
		$admin_body_class .= ' network-admin';
	}

	$admin_body_class .= ' no-customize-support no-svg';

	?>
	</head>
	<?php

	/**
	 * Filters the CSS classes for the body tag in the admin.
	 *
	 * This filter differs from the {@see 'post_class'} and {@see 'body_class'} filters
	 * in two important ways:
	 *
	 * 1. `$classes` is a space-separated string of class names instead of an array.
	 * 2. Not all core admin classes are filterable, notably: wp-admin, wp-core-ui,
	 *    and no-js cannot be removed.
	 *
	 * @since wp-core 2.3.0
	 *
	 * @param string $classes Space-separated list of CSS classes.
	 */
	$admin_body_classes = apply_filters( 'admin_body_class', '' );

	?>
	<body class="wp-admin wp-core-ui no-js <?php echo $admin_body_classes . ' ' . $admin_body_class; ?>">
	<script type="text/javascript">
		document.body.className = document.body.className.replace('no-js','js');
	</script>
	<?php
}

/**
 * This matches the portion of creating a form found in edit-form-advanced.php.
 *
 * Code starts roughly around line 500.
 *
 * @since 1.5.0
 *
 * @param WP_Post $post     Current post object.
 * @param string  $location Metabox location: one of 'normal', 'advanced', 'side'.
 */
function gutenberg_meta_box_partial_page_post_form( $post, $location ) {
	$notice     = false;
	$form_extra = '';
	if ( 'auto-draft' === $post->post_status ) {
		$post->post_title = '';
		$autosave         = false;
		$form_extra      .= "<input type='hidden' id='auto_draft' name='auto_draft' value='1' />";
	} else {
		$autosave = wp_get_post_autosave( $post->id );
	}

	$form_action  = 'editpost';
	$nonce_action = 'update-post_' . $post->ID;
	$form_extra  .= "<input type='hidden' id='post_ID' name='post_ID' value='" . esc_attr( $post->ID ) . "' />";
	?>
	<form name="post" action="post.php" method="post" id="post" data-location="<?php echo esc_attr( $location ); ?>"
	<?php
	/**
	 * Fires inside the post editor form tag.
	 *
	 * @since wp-core 3.0.0
	 *
	 * @param WP_Post $post Post object.
	 */
	do_action( 'post_edit_form_tag', $post );

	$referer = wp_get_referer();
	?>
	><!-- End of Post Form Tag. -->
	<?php wp_nonce_field( $nonce_action ); ?>
	<?php
		$current_user = wp_get_current_user();
		$user_id      = $current_user->ID;
	?>
	<input type="hidden" id="user-id" name="user_ID" value="<?php echo (int) $user_id; ?>" />
	<input type="hidden" id="hiddenaction" name="action" value="<?php echo esc_attr( $form_action ); ?>" />
	<input type="hidden" id="originalaction" name="originalaction" value="<?php echo esc_attr( $form_action ); ?>" />
	<input type="hidden" id="post_author" name="post_author" value="<?php echo esc_attr( $post->post_author ); ?>" />
	<input type="hidden" id="post_type" name="post_type" value="<?php echo esc_attr( $post->post_type ); ?>" />
	<input type="hidden" id="original_post_status" name="original_post_status" value="<?php echo esc_attr( $post->post_status ); ?>" />
	<input type="hidden" id="referredby" name="referredby" value="<?php echo $referer ? esc_url( $referer ) : ''; ?>" />
	<!-- These fields are not part of the standard post form. Used to redirect back to this page on save. -->
	<input type="hidden" name="gutenberg_meta_boxes" value="gutenberg_meta_boxes" />
	<input type="hidden" name="gutenberg_meta_box_location" value="<?php echo esc_attr( $location ); ?>" />
	<?php if ( ! empty( $active_post_lock ) ) : ?>
	<input type="hidden" id="active_post_lock" value="<?php echo esc_attr( implode( ':', $active_post_lock ) ); ?>" />
	<?php endif; ?>

	<?php
	if ( 'draft' !== get_post_status( $post ) ) {
		wp_original_referer_field( true, 'previous' );
	}

	echo $form_extra;

	wp_nonce_field( 'meta-box-order', 'meta-box-order-nonce', false );
	wp_nonce_field( 'closedpostboxes', 'closedpostboxesnonce', false );

	// Permalink title nonce.
	wp_nonce_field( 'samplepermalink', 'samplepermalinknonce', false );

	/**
	 * Fires at the beginning of the edit form.
	 *
	 * At this point, the required hidden fields and nonces have already been output.
	 *
	 * @since wp-core 3.7.0
	 *
	 * @param WP_Post $post Post object.
	 */
	do_action( 'edit_form_top', $post );

	/**
	 * The #poststuff id selector is import for styles and scripts.
	 */
	?>
	<div id="poststuff" class="sidebar-open">
		<div><!-- THIS IS SOMEHOW REALLY IMPORTANT FOR IFRAMES TO RESIZE CORRECTLY -->
			<div id="postbox-container-2" class="postbox-container">
	<?php
}

/**
 * This matches the portion of creating a form found in edit-form-advanced.php.
 *
 * @since 1.5.0
 *
 * @param string $hook_suffix The hook suffix of the current page.
 */
function gutenberg_meta_box_partial_page_admin_footer( $hook_suffix ) {
	?>
	</div><!-- END of important resize div. -->
	<?php

	/**
	 * Prints scripts or data before the default footer scripts.
	 *
	 * @since wp-core 1.2.0
	 *
	 * @param string $data The data to print.
	 */
	do_action( 'admin_footer', '' );

	/**
	 * Prints scripts and data queued for the footer.
	 *
	 * The dynamic portion of the hook name, `$hook_suffix`,
	 * refers to the global hook suffix of the current page.
	 *
	 * @since wp-core 4.6.0
	 */
	// @codingStandardsIgnoreStart
	do_action( "admin_print_footer_scripts-{$hook_suffix}" );
	// @codingStandardsIgnoreEnd

	/**
	 * Prints any scripts and data queued for the footer.
	 *
	 * @since wp-core 2.8.0
	 *
	 * @note This seems to be where most styles etc are hooked into.
	 */
	do_action( 'admin_print_footer_scripts' );

	/**
	 * Prints scripts or data after the default footer scripts.
	 *
	 * The dynamic portion of the hook name, `$hook_suffix`,
	 * refers to the global hook suffix of the current page.
	 *
	 * @since wp-core 2.8.0
	 */
	// @codingStandardsIgnoreStart
	do_action( "admin_footer-{$hook_suffix}" );
	// @codingStandardsIgnoreEnd

	// get_site_option() won't exist when auto upgrading from <= 2.7.
	if ( function_exists( 'get_site_option' ) ) {
		if ( false === get_site_option( 'can_compress_scripts' ) ) {
			compression_test();
		}
	}

	?>
		<div class="clear"></div></div><!-- wpwrap -->
		<script type="text/javascript">if(typeof wpOnload=='function')wpOnload();</script>
	</body>
	</html>

	<?php
}

/**
 * Allows the meta box endpoint to correctly redirect to the meta box endpoint
 * when a post is saved.
 *
 * @since 1.5.0
 *
 * @param string $location The location of the meta box, 'side', 'normal'.
 * @param int    $post_id  Post ID.
 *
 * @hooked redirect_post_location priority 10
 */
function gutenberg_meta_box_save_redirect( $location, $post_id ) {
	if ( isset( $_REQUEST['gutenberg_meta_boxes'] )
			&& isset( $_REQUEST['gutenberg_meta_box_location'] )
			&& 'gutenberg_meta_boxes' === $_REQUEST['gutenberg_meta_boxes'] ) {
		$meta_box_location = $_REQUEST['gutenberg_meta_box_location'];
		$location          = add_query_arg(
			array(
				'meta_box'       => $meta_box_location,
				'action'         => 'edit',
				'classic-editor' => true,
				'post'           => $post_id,
			),
			admin_url( 'post.php' )
		);
	}

	return $location;
}

add_filter( 'redirect_post_location', 'gutenberg_meta_box_save_redirect', 10, 2 );

/**
 * Filter out core meta boxes as well as the post thumbnail.
 *
 * @since 1.5.0
 *
 * @param array $meta_boxes Meta box data.
 */
function gutenberg_filter_meta_boxes( $meta_boxes ) {
	$core_side_meta_boxes = array(
		'submitdiv',
		'formatdiv',
		'categorydiv',
		'tagsdiv-post_tag',
		'postimagediv',
	);

	$core_normal_meta_boxes = array(
		'revisionsdiv',
		'postexcerpt',
		'trackbacksdiv',
		'postcustom',
		'commentstatusdiv',
		'commentsdiv',
		'slugdiv',
		'authordiv',
	);

	$taxonomy_callbacks_to_unset = array(
		'post_tags_meta_box',
		'post_categories_meta_box',
	);

	foreach ( $meta_boxes as $page => $contexts ) {
		foreach ( $contexts as $context => $priorities ) {
			foreach ( $priorities as $priority => $boxes ) {
				foreach ( $boxes as $name => $data ) {
					if ( 'normal' === $context && in_array( $name, $core_normal_meta_boxes ) ) {
						unset( $meta_boxes[ $page ][ $context ][ $priority ][ $name ] );
					}
					if ( 'side' === $context && in_array( $name, $core_side_meta_boxes ) ) {
						unset( $meta_boxes[ $page ][ $context ][ $priority ][ $name ] );
					}
					// Filter out any taxonomies as Gutenberg already provides JS alternative.
					if ( isset( $data['callback'] ) && in_array( $data['callback'], $taxonomy_callbacks_to_unset ) ) {
						unset( $meta_boxes[ $page ][ $context ][ $priority ][ $name ] );
					}
				}
			}
		}
	}

	return $meta_boxes;
}

/**
 * Check whether a meta box is empty.
 *
 * @since 1.5.0
 *
 * @param array  $meta_boxes Meta box data.
 * @param string $context    Location of meta box, one of side, advanced, normal.
 * @param string $post_type  Post type to investigate.
 * @return boolean Whether the meta box is empty.
 */
function gutenberg_is_meta_box_empty( $meta_boxes, $context, $post_type ) {
	$page = $post_type;

	if ( ! isset( $meta_boxes[ $page ][ $context ] ) ) {
		return true;
	}

	foreach ( $meta_boxes[ $page ][ $context ] as $priority => $boxes ) {
		if ( ! empty( $boxes ) ) {
			return false;
		}
	}

	return true;
}

add_filter( 'filter_gutenberg_meta_boxes', 'gutenberg_filter_meta_boxes' );
