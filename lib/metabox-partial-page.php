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
 * Renders a partial page of metaboxes.
 *
 * @param string $post_type Current post type.
 * @param string $metabox_context  The context location of the metabox. Referred to as context in core.
 */
function gutenberg_metabox_partial_page( $post_type, $metabox_context ) {
	/**
	 * The metabox param as long as it is set on the wp-admin/post.php request
	 * will trigger this API.
	 *
	 * Essentially all that happens is we try to load in the scripts from admin_head
	 * and admin_footer to mimic the assets for a typical post.php.
	 *
	 * @in_the_future Hopefully the metabox param can be changed to a location,
	 * or contenxt, so that we can use this API to render metaboxes that appear,
	 * in the sidebar vs. regular content, or core metaboxes vs others. For now
	 * a request like http://local.wordpress.dev/wp-admin/post.php?post=40007&action=edit&metabox=taco
	 * works just fine! Will only work on existing posts so far. Need to handle
	 * this differently for new posts.
	 */
	if ( isset( $_REQUEST['metabox'] ) && 'post.php' === $GLOBALS['pagenow'] ) {
		$location = $_REQUEST['metabox'];
		if ( ! in_array( $_REQUEST['metabox'], array( 'side', 'normal', 'advanced' ), true ) ) {
			wp_die( __( 'The metabox parameter should be one of "side", "normal", or "advanced".', 'gutenberg' ) );
		}

		/**
		 * Prevent over firing of the metabox rendering.
		 *
		 * The hook do_action( 'do_meta_boxes', ... ) fires three times in
		 * edit-form-advanced.php
		 *
		 * To make sure we properly fire on all three metabox locations, except
		 * advanced, as advanced is tied in with normal for ease of use reasons, we
		 * need to verify that the action location/context matches our requests
		 * meta box location/context. We then exit early if they do not match.
		 * This will prevent execution thread from dieing, so the subsequen calls
		 * to do_meta_boxes can fire.
		 */
		if ( $_REQUEST['metabox'] !== $metabox_context ) {
			return;
		}

		global $post, $wp_meta_boxes, $hook_suffix, $current_screen, $wp_locale;

		/* Scripts and styles that metaboxes can potentially be using */
		wp_enqueue_style( 'common' );
		wp_enqueue_style( 'buttons' );
		wp_enqueue_style( 'colors' );
		wp_enqueue_style( 'ie' );

		// Loads edit.css from admin, which is not registered anywhere from what I can tell.
		wp_enqueue_style( 'edit-stuff', get_admin_url( null, 'css/edit.css' ) );

		wp_enqueue_script( 'utils' );
		wp_enqueue_script( 'common' );
		wp_enqueue_script( 'svg-painter' );

		wp_enqueue_style(
			'metabox-gutenberg',
			gutenberg_url( 'editor/build/metabox-iframe.css' ),
			array(),
			filemtime( gutenberg_dir_path() . 'editor/build/metabox-iframe.css' )
		);

		wp_enqueue_script(
			'metabox-gutenberg',
			gutenberg_url( 'assets/js/metabox.js' ),
			array(),
			filemtime( gutenberg_dir_path() . 'assets/js/metabox.js' ),
			true
		);

		// Grab the admin body class.
		$admin_body_class = preg_replace( '/[^a-z0-9_-]+/i', '-', $hook_suffix );

		?>
		<!-- Add an html class so that scroll bars can be removed in css and make it appear as though the iframe is one with Gutenberg. -->
		<html id="gutenberg-metabox-html" class="gutenberg-metabox-html">
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
		<script>
			function resizeIframe( obj ) {
				obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
			}
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

		// This page should always match up with the edit action.
		$action = 'edit';

		?>
		<body class="wp-admin wp-core-ui no-js <?php echo $admin_body_classes . ' ' . $admin_body_class; ?>">
		<script type="text/javascript">
			document.body.className = document.body.className.replace('no-js','js');
		</script>
		<?php
		$notice = false;
		$form_extra = '';
		if ( 'auto-draft' === $post->post_status ) {
			if ( 'edit' === $action ) {
				$post->post_title = '';
			}
			$autosave = false;
			$form_extra .= "<input type='hidden' id='auto_draft' name='auto_draft' value='1' />";
		} else {
			$autosave = wp_get_post_autosave( $post->id );
		}

		$form_action = 'editpost';
		$nonce_action = 'update-post_' . $post->ID;
		$form_extra .= "<input type='hidden' id='post_ID' name='post_ID' value='" . esc_attr( $post->ID ) . "' />";
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
			$user_id = $current_user->ID;
		?>
		<input type="hidden" id="user-id" name="user_ID" value="<?php echo (int) $user_id; ?>" />
		<input type="hidden" id="hiddenaction" name="action" value="<?php echo esc_attr( $form_action ); ?>" />
		<input type="hidden" id="originalaction" name="originalaction" value="<?php echo esc_attr( $form_action ); ?>" />
		<input type="hidden" id="post_author" name="post_author" value="<?php echo esc_attr( $post->post_author ); ?>" />
		<input type="hidden" id="post_type" name="post_type" value="<?php echo esc_attr( $post->post_type ); ?>" />
		<input type="hidden" id="original_post_status" name="original_post_status" value="<?php echo esc_attr( $post->post_status ); ?>" />
		<input type="hidden" id="referredby" name="referredby" value="<?php echo $referer ? esc_url( $referer ) : ''; ?>" />
		<!-- These fields are not part of the standard post form. Used to redirect back to this page on save. -->
		<input type="hidden" name="gutenberg_metaboxes" value="gutenberg_metaboxes" />
		<input type="hidden" name="gutenberg_metabox_location" value="<?php echo esc_attr( $_REQUEST['metabox'] ); ?>" />
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

		// Styles.
		$heading_style = 'display:flex;justify-content:space-between;align-items:center;font-size:14px;margin:0;line-height: 50px;height: 50px;padding: 0 15px;background-color: #eee;border-top: 1px solid #e4e2e7;border-bottom: 1px solid #e4e2e7;box-sizing: border-box;';

		/**
		 * The #poststuff id selector is import for styles and scripts.
		 *
		 * It would be interesting to do a svn blame for that one. #blamenacin.
		 * The sidebar-open class is used to work in tandem with the sidebar
		 * opening and closing in the block editor. By default it is open.
		 */
		?>
		<header class="gutenberg-metaboxes__header" style="<?php echo $heading_style; ?>">
			<h2 style="font-size: 14px;">Extended Settings</h2>
			<!-- @TODO leaving this commented out as it may need to be used. -->
			<!--<input name="save" type="submit" class="button button-primary button-large" id="publish" value="Update Settings">-->
		</header>
		<div id="poststuff" class="sidebar-open">
			<div class="gutenberg-metaboxes">
				<div id="postbox-container-2" class="postbox-container">
		<?php

		// Handle metabox state.
		$_original_metaboxes = $wp_meta_boxes;

		/**
		 * Fires right before the metaboxes are rendered.
		 *
		 * This allows for the filtering of metabox data, that should already be
		 * present by this point. Do not use as a means of adding metabox data.
		 *
		 * By default gutenberg_filter_metaboxes() is hooked in and can be
		 * unhooked to restore core metaboxes.
		 *
		 * @param array $wp_meta_boxes Global metabox state.
		 */
		$wp_meta_boxes = apply_filters( 'filter_gutenberg_metaboxes', $wp_meta_boxes );

		// Exit early if the metabox is empty. Send out a post message to tell React to not render metaboxes.
		if ( gutenberg_is_metabox_empty( $wp_meta_boxes, $_REQUEST['metabox'], $post->post_type ) ) {
			exit();
		}

		$locations = array();

		if ( 'normal' === $_REQUEST['metabox'] || 'advanced' === $_REQUEST['metabox'] ) {
			$locations = array( 'advanced', 'normal' );
		}

		if ( 'side' === $_REQUEST['metabox'] ) {
			$locations = array( 'side' );
		}

		if ( ! empty( $locations ) ) {
			foreach ( $locations as $location ) {
				do_meta_boxes(
					$current_screen,
					$location,
					$post
				);
			}
		}

		// Reset metaboxes.
		$wp_meta_boxes = $_original_metaboxes;
		?>
		<!-- Don't ask why this works, but for some reason do_meta_boxes() will output closing div tags, but still needs this one. -->
		</div>
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
		/**
		 * Shutdown hooks potentially firing.
		 *
		 * Try Query Monitor plugin to make sure the output isn't janky.
		 */
		remove_all_actions( 'shutdown' );
		exit();
	}
}

add_action( 'do_meta_boxes', 'gutenberg_metabox_partial_page', 1000, 2 );

/**
 * Allows the metabox endpoint to correctly redirect to the metabox endpoint
 * when a post is saved.
 *
 * @param string $location The location of the metabox, 'side', 'normal'.
 * @param int    $post_id  Post ID.
 *
 * @hooked redirect_post_location priority 10
 */
function gutenberg_metabox_save_redirect( $location, $post_id ) {
	if ( isset( $_REQUEST['gutenberg_metaboxes'] )
			&& isset( $_REQUEST['gutenberg_metabox_location'] )
			&& 'gutenberg_metaboxes' === $_REQUEST['gutenberg_metaboxes'] ) {
		$metabox_location = $_REQUEST['gutenberg_metabox_location'];
		$location = add_query_arg(
			array(
				'metabox' => $metabox_location,
				'action' => 'edit',
				'post' => $post_id,
			),
			admin_url( 'post.php' )
		);
	}

	return $location;
}

add_filter( 'redirect_post_location', 'gutenberg_metabox_save_redirect', 10, 2 );

/**
 * Filter out core metaboxes as well as the post thumbnail.
 *
 * @param array $metaboxes Metabox data.
 */
function gutenberg_filter_metaboxes( $metaboxes ) {
	$core_side_metaboxes = array(
		'submitdiv',
		'formatdiv',
		'categorydiv',
		'tagsdiv-post_tag',
		'postimagediv',
	);

	$core_normal_metaboxes = array(
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

	foreach ( $metaboxes as $page => $contexts ) {
		foreach ( $contexts as $context => $priorities ) {
			foreach ( $priorities as $priority => $boxes ) {
				foreach ( $boxes as $name => $data ) {
					if ( 'normal' === $context && in_array( $name, $core_normal_metaboxes, true ) ) {
						unset( $metaboxes[ $page ][ $context ][ $priority ][ $name ] );
					}
					if ( 'side' === $context && in_array( $name, $core_side_metaboxes, true ) ) {
						unset( $metaboxes[ $page ][ $context ][ $priority ][ $name ] );
					}
					// Filter out any taxonomies as Gutenberg already provides JS alternative.
					if ( isset( $metaboxes[ $page ][ $context ][ $priority ][ $name ] ) && in_array( $metaboxes[ $page ][ $context ][ $priority ][ $name ]['callback'], $taxonomy_callbacks_to_unset, true ) ) {
						unset( $metaboxes[ $page ][ $context ][ $priority ][ $name ] );
					}
				}
			}
		}
	}

	return $metaboxes;
}

/**
 * Check whether a metabox is empty.
 *
 * @param array  $metaboxes Metabox data.
 * @param string $context   Location of metabox, one of side, advanced, normal.
 * @param string $post_type Post type to investigate.
 * @return boolean Whether the metabox is empty.
 */
function gutenberg_is_metabox_empty( $metaboxes, $context, $post_type ) {
	$page = $post_type;
	$is_empty = true;

	foreach ( $metaboxes[ $page ][ $context ] as $priority => $boxes ) {
		if ( ! empty( $boxes ) ) {
			$is_empty = false;
			break;
		}
	}

	return $is_empty;
}

add_filter( 'filter_gutenberg_metaboxes', 'gutenberg_filter_metaboxes', 10, 1 );

?>
