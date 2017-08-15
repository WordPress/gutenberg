<?php
/**
 * Initialization and wp-admin integration for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

function gutenberg_meta_box_api() {
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
	if ( isset( $_REQUEST['metabox'] ) && $GLOBALS['pagenow'] === 'post.php' ) {
		/* Scripts and styles that metaboxes can potentially be using */
		wp_enqueue_style( 'common' );
		wp_enqueue_style( 'buttons' );
		wp_enqueue_style( 'colors' );
		wp_enqueue_style( 'ie' );
		wp_enqueue_script( 'utils' );
		wp_enqueue_script( 'svg-painter' );

		// Grab the admin body class.
		$admin_body_class = preg_replace('/[^a-z0-9_-]+/i', '-', $hook_suffix);
		?>
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

		// More scripts.
		wp_enqueue_script( 'post' );
		wp_enqueue_script( 'editor-expand' );

		global $post, $wp_meta_boxes, $hook_suffix;

		/**
		 * Enqueue scripts for all admin pages.
		 *
		 * @since 2.8.0
		 *
		 * @param string $hook_suffix The current admin page.
		 */
		do_action( 'admin_enqueue_scripts', $hook_suffix );

		/**
		 * Fires when styles are printed for a specific admin page based on $hook_suffix.
		 *
		 * @since 2.6.0
		 */
		do_action( "admin_print_styles-{$hook_suffix}" );

		/**
		 * Fires when styles are printed for all admin pages.
		 *
		 * @since 2.6.0
		 */
		do_action( 'admin_print_styles' );

		/**
		 * Fires when scripts are printed for a specific admin page based on $hook_suffix.
		 *
		 * @since 2.1.0
		 */
		do_action( "admin_print_scripts-{$hook_suffix}" );

		/**
		 * Fires when scripts are printed for all admin pages.
		 *
		 * @since 2.1.0
		 */
		do_action( 'admin_print_scripts' );

		/**
		 * Fires in head section for a specific admin page.
		 *
		 * The dynamic portion of the hook, `$hook_suffix`, refers to the hook suffix
		 * for the admin page.
		 *
		 * @since 2.1.0
		 */
		do_action( "admin_head-{$hook_suffix}" );

		/**
		 * Fires in head section for all admin pages.
		 *
		 * @since 2.1.0
		 */
		do_action( 'admin_head' );

		$locations = array( 'normal', 'advanced', 'side' );
		//foreach( $locations as $location ) {
			do_meta_boxes(
				null,
				'normal',
				$post
			);
		//}
		echo '<pre>', var_dump( $wp_meta_boxes ), '</pre>';

		/**
		 * Prints scripts or data before the default footer scripts.
		 *
		 * @since 1.2.0
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
		 * @since 4.6.0
		 */
		do_action( "admin_print_footer_scripts-{$hook_suffix}" );

		/**
		 * Prints any scripts and data queued for the footer.
		 *
		 * @since 2.8.0
		 */
		do_action( 'admin_print_footer_scripts' );

		/**
		 * Prints scripts or data after the default footer scripts.
		 *
		 * The dynamic portion of the hook name, `$hook_suffix`,
		 * refers to the global hook suffix of the current page.
		 *
		 * @since 2.8.0
		 */
		do_action( "admin_footer-{$hook_suffix}" );

		exit( 'YOLO' );

		/**
		 * Shutdown hooks potentially firing.
		 *
		 * Try Query Monitor plugin to make sure the output isn't janky.
		 */
	}
}

add_action( 'do_meta_boxes', 'gutenberg_meta_box_api' );

?>
