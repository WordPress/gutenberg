<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the new block editor in core. <strong>Meant for development, do not run on real sites.</strong>
 * Version: 1.4.0
 * Author: Gutenberg Team
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

/**
 * Project.
 *
 * The main entry point for the Gutenberg editor. Renders the editor on the
 * wp-admin page for the plugin.
 *
 * @todo Remove the temporary fix for the NVDA screen reader and use meaningful
 *       content instead. See pull #2380 and issues #467 and #503.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	?>
	<div class="nvda-temp-fix screen-reader-text">&nbsp;</div>
	<div class="gutenberg">
		<div id="editor" class="gutenberg__editor"></div>
	</div>
	<?php
}

/**
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	global $menu, $submenu;

	add_menu_page(
		'Gutenberg',
		'Gutenberg',
		'edit_posts',
		'gutenberg',
		'the_gutenberg_project',
		'dashicons-edit'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Demo', 'gutenberg' ),
		__( 'Demo', 'gutenberg' ),
		'edit_posts',
		'gutenberg'
	);

	if ( current_user_can( 'edit_posts' ) ) {
		$submenu['gutenberg'][] = array(
			__( 'Feedback', 'gutenberg' ),
			'edit_posts',
			'http://wordpressdotorg.polldaddy.com/s/gutenberg-support',
		);

		$submenu['gutenberg'][] = array(
			__( 'Documentation', 'gutenberg' ),
			'edit_posts',
			'http://gutenberg-devdoc.surge.sh/',
		);
	}
}
add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Display a notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	echo __( 'Gutenberg requires WordPress 4.8 or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' );
	echo '</p></div>';

	deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
}

/**
 * Verify that we can initialize the Gutenberg editor plugin and add hooks.
 *
 * @since 0.1.0
 */
function gutenberg_can_init() {
	// Get unmodified $wp_version.
	include( ABSPATH . WPINC . '/version.php' );

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	if ( version_compare( $version, '4.9-beta1-42000', '>=' ) ) { // TODO: change the last bit with the release number when `replace_editor` is available.
		add_filter( 'replace_editor', 'gutenberg_init', 10, 2 );
	} elseif ( version_compare( $version, '4.8', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
	} else {
		add_action( 'load-post.php', 'gutenberg_intercept_edit_post' );
		add_action( 'load-post-new.php', 'gutenberg_intercept_post_new' );
	}
}
add_action( 'plugins_loaded', 'gutenberg_can_init' );

/**
 * Initialize Gutenberg.
 *
 * Load API functions, register scripts and actions, etc.
 *
 * @param  bool   $return Whether to replace the editor. Used in the `replace_editor` filter.
 * @param  object $post   The post to edit or an auto-draft.
 * @return bool   Whether Gutenberg was initialized.
 */
function gutenberg_init( $return, $post ) {
	if ( true === $return && current_filter() === 'replace_editor' ) {
		return $return;
	}

	$post_type        = $post->post_type;
	$post_type_object = get_post_type_object( $post_type );

	if ( 'attachment' === $post_type ) {
		return false;
	}

	if ( ! $post_type_object->show_in_rest ) {
		return false;
	}

	if ( ! post_type_supports( $post_type, 'editor' ) ) {
		return false;
	}

	require_once dirname( __FILE__ ) . '/lib/load.php';

	require_once( ABSPATH . 'wp-admin/admin-header.php' );
	the_gutenberg_project();

	return true;
}

/**
 * Emulate post.php
 */
function gutenberg_intercept_edit_post() {
	global $post_type, $post_type_object, $post, $post_id, $post_ID, $title, $editing,
		$typenow, $parent_file, $submenu_file, $post_new_file;

	wp_reset_vars( array( 'action' ) );

	// Other actions are handled in post.php.
	if ( 'edit' !== $GLOBALS['action'] ) {
		return;
	}

	if ( isset( $_GET['post'] ) ) {
		$post_ID = (int) $_GET['post'];
		$post_id = $post_ID;
	}

	if ( empty( $post_id ) ) {
		return;
	}

	$post = get_post( $post_id );

	// Errors and invalid requests are handled in post.php, do not intercept.
	if ( $post ) {
		$post_type        = $post->post_type;
		$post_type_object = get_post_type_object( $post_type );
	} else {
		return;
	}

	if ( ! $post_type_object ) {
		return;
	}

	if ( ! in_array( $typenow, get_post_types( array( 'show_ui' => true ) ) ) ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( 'trash' == $post->post_status ) {
		return;
	}

	if ( ! empty( $_GET['get-post-lock'] ) ) {
		check_admin_referer( 'lock-post_' . $post_id );
		wp_set_post_lock( $post_id );
		wp_redirect( get_edit_post_link( $post_id, 'url' ) );
		exit();
	}

	$editing = true;
	$title   = $post_type_object->labels->edit_item;

	$post_type = $post->post_type;
	if ( 'post' == $post_type ) {
		$parent_file   = 'edit.php';
		$submenu_file  = 'edit.php';
		$post_new_file = 'post-new.php';
	} elseif ( 'attachment' == $post_type ) {
		$parent_file   = 'upload.php';
		$submenu_file  = 'upload.php';
		$post_new_file = 'media-new.php';
	} else {
		if ( isset( $post_type_object ) && $post_type_object->show_in_menu && true !== $post_type_object->show_in_menu ) {
			$parent_file = $post_type_object->show_in_menu;
		} else {
			$parent_file = "edit.php?post_type=$post_type";
		}

		$submenu_file  = "edit.php?post_type=$post_type";
		$post_new_file = "post-new.php?post_type=$post_type";
	}

	if ( gutenberg_init( false, $post ) ) {
		include( ABSPATH . 'wp-admin/admin-footer.php' );
		exit;
	}
}

/**
 * Emulate post-new.php
 */
function gutenberg_intercept_post_new() {
	global $post_type, $post_type_object, $post, $post_ID, $title, $editing,
		$parent_file, $submenu_file, $_registered_pages;

	if ( ! isset( $_GET['post_type'] ) ) {
		$post_type = 'post';
	} elseif ( in_array( $_GET['post_type'], get_post_types( array( 'show_ui' => true ) ) ) ) {
		$post_type = $_GET['post_type'];
	} else {
		return;
	}
	$post_type_object = get_post_type_object( $post_type );

	if ( 'post' == $post_type ) {
		$parent_file  = 'edit.php';
		$submenu_file = 'post-new.php';
	} elseif ( 'attachment' == $post_type ) {
		if ( wp_redirect( admin_url( 'media-new.php' ) ) ) {
			exit;
		}
	} else {
		$submenu_file = "post-new.php?post_type=$post_type";
		if ( isset( $post_type_object ) && $post_type_object->show_in_menu && true !== $post_type_object->show_in_menu ) {
			$parent_file = $post_type_object->show_in_menu;
			// What if there isn't a post-new.php item for this post type?
			if ( ! isset( $_registered_pages[ get_plugin_page_hookname( "post-new.php?post_type=$post_type", $post_type_object->show_in_menu ) ] ) ) {
				if ( isset( $_registered_pages[ get_plugin_page_hookname( "edit.php?post_type=$post_type", $post_type_object->show_in_menu ) ] ) ) {
					// Fall back to edit.php for that post type, if it exists.
					$submenu_file = "edit.php?post_type=$post_type";
				} else {
					// Otherwise, give up and highlight the parent.
					$submenu_file = $parent_file;
				}
			}
		} else {
			$parent_file = "edit.php?post_type=$post_type";
		}
	}

	$title   = $post_type_object->labels->add_new_item;
	$editing = true;

	// Errors and invalid requests are handled in post-new.php, do not intercept.
	if ( ! current_user_can( $post_type_object->cap->edit_posts ) || ! current_user_can( $post_type_object->cap->create_posts ) ) {
		return;
	}

	// Schedule auto-draft cleanup.
	if ( ! wp_next_scheduled( 'wp_scheduled_auto_draft_delete' ) ) {
		wp_schedule_event( time(), 'daily', 'wp_scheduled_auto_draft_delete' );
	}

	$post    = get_default_post_to_edit( $post_type, true );
	$post_ID = $post->ID;

	if ( gutenberg_init( false, $post ) ) {
		include( ABSPATH . 'wp-admin/admin-footer.php' );
		exit;
	}
}

/**
 * Redirects the demo page to edit a new post.
 */
function gutenberg_redirect_demo() {
	global $pagenow;

	if ( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'gutenberg' === $_GET['page'] ) {
		wp_safe_redirect( admin_url( 'post-new.php?gutenberg-demo' ) );
		exit;
	}
}
add_action( 'admin_init', 'gutenberg_redirect_demo' );
