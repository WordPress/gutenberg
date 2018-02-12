<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the new block editor in core.
 * Version: 2.1.0
 * Author: Gutenberg Team
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

gutenberg_pre_init();

/**
 * Project.
 *
 * The main entry point for the Gutenberg editor. Renders the editor on the
 * wp-admin page for the plugin.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	global $post_type_object;
	?>
	<div class="gutenberg">
		<h1 class="screen-reader-text"><?php echo esc_html( $post_type_object->labels->edit_item ); ?></h1>
		<div id="editor" class="gutenberg__editor"></div>
		<div id="metaboxes" style="display: none;">
			<?php the_gutenberg_metaboxes(); ?>
		</div>
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
	global $submenu;

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
			'https://wordpress.org/gutenberg/handbook/',
		);
	}
}
add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Display a version notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	echo __( 'Gutenberg requires WordPress 4.9 or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' );
	echo '</p></div>';

	deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
}

/**
 * Display a build notice.
 *
 * @since 0.1.0
 */
function gutenberg_build_files_notice() {
	echo '<div class="error"><p>';
	echo __( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor , then load it.
 *
 * @since 1.5.0
 */
function gutenberg_pre_init() {
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( dirname( __FILE__ ) . '/blocks/build' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	if ( version_compare( $version, '4.9', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
		return;
	}

	require_once dirname( __FILE__ ) . '/lib/load.php';

	if ( version_compare( $version, '4.9-beta1-41829', '<' ) ) {
		add_action( 'load-post.php', 'gutenberg_intercept_edit_post' );
		add_action( 'load-post-new.php', 'gutenberg_intercept_post_new' );
		return;
	}

	add_filter( 'replace_editor', 'gutenberg_init', 10, 2 );
}

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

	if ( isset( $_GET['classic-editor'] ) ) {
		return false;
	}

	if ( ! gutenberg_can_edit_post( $post ) ) {
		return false;
	}

	add_action( 'admin_enqueue_scripts', 'gutenberg_editor_scripts_and_styles' );
	add_filter( 'screen_options_show_screen', '__return_false' );
	add_filter( 'admin_body_class', 'gutenberg_add_admin_body_class' );

	require_once ABSPATH . 'wp-admin/admin-header.php';
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

	if ( empty( $_GET['post'] ) || ! is_numeric( $_GET['post'] ) ) {
		return;
	}

	$post_ID = (int) $_GET['post'];
	$post_id = $post_ID;

	$post = get_post( $post_id );

	// Errors and invalid requests are handled in post.php, do not intercept.
	if ( ! $post ) {
		return;
	}

	$post_type        = $post->post_type;
	$post_type_object = get_post_type_object( $post_type );

	if ( ! $post_type_object ) {
		return;
	}

	if ( ! in_array( $typenow, get_post_types( array( 'show_ui' => true ) ), true ) ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( 'trash' === $post->post_status ) {
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

	if ( 'post' === $post_type ) {
		$parent_file   = 'edit.php';
		$submenu_file  = 'edit.php';
		$post_new_file = 'post-new.php';
	} elseif ( 'attachment' === $post_type ) {
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
		include ABSPATH . 'wp-admin/admin-footer.php';
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
	} elseif ( in_array( $_GET['post_type'], get_post_types( array( 'show_ui' => true ) ), true ) ) {
		$post_type = $_GET['post_type'];
	} else {
		return;
	}
	$post_type_object = get_post_type_object( $post_type );

	if ( 'post' === $post_type ) {
		$parent_file  = 'edit.php';
		$submenu_file = 'post-new.php';
	} elseif ( 'attachment' === $post_type ) {
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
		include ABSPATH . 'wp-admin/admin-footer.php';
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

/**
 * Adds the filters to register additional links for the Gutenberg editor in
 * the post/page screens.
 *
 * @since 1.5.0
 */
function gutenberg_add_edit_link_filters() {
	// For hierarchical post types.
	add_filter( 'page_row_actions', 'gutenberg_add_edit_link', 10, 2 );
	// For non-hierarchical post types.
	add_filter( 'post_row_actions', 'gutenberg_add_edit_link', 10, 2 );
}
add_action( 'admin_init', 'gutenberg_add_edit_link_filters' );

/**
 * Registers an additional link in the post/page screens to edit any post/page in
 * the Classic editor.
 *
 * @since 1.5.0
 *
 * @param  array   $actions Post actions.
 * @param  WP_Post $post    Edited post.
 *
 * @return array          Updated post actions.
 */
function gutenberg_add_edit_link( $actions, $post ) {
	if ( ! gutenberg_can_edit_post( $post ) ) {
		return $actions;
	}

	$edit_url = get_edit_post_link( $post->ID, 'raw' );
	$edit_url = add_query_arg( 'classic-editor', '', $edit_url );

	// Build the classic edit action. See also: WP_Posts_List_Table::handle_row_actions().
	$title       = _draft_or_post_title( $post->ID );
	$edit_action = array(
		'classic' => sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			esc_url( $edit_url ),
			esc_attr( sprintf(
				/* translators: %s: post title */
				__( 'Edit &#8220;%s&#8221; in the classic editor', 'gutenberg' ),
				$title
			) ),
			__( 'Classic Editor', 'gutenberg' )
		),
	);

	// Insert the Classic Edit action after the Edit action.
	$edit_offset = array_search( 'edit', array_keys( $actions ), true );
	$actions     = array_merge(
		array_slice( $actions, 0, $edit_offset + 1 ),
		$edit_action,
		array_slice( $actions, $edit_offset + 1 )
	);

	return $actions;
}

/**
 * Prints the JavaScript to replace the default "Add New" button.$_COOKIE
 *
 * @since 1.5.0
 */
function gutenberg_replace_default_add_new_button() {
	global $typenow;
	if ( ! gutenberg_can_edit_post_type( $typenow ) ) {
		return;
	}
	?>
	<style type="text/css">
		.split-page-title-action {
			display: inline-block;
		}

		.split-page-title-action a,
		.split-page-title-action a:active,
		.split-page-title-action .expander:after {
			padding: 6px 10px;
			position: relative;
			top: -3px;
			text-decoration: none;
			border: 1px solid #ccc;
			border-radius: 2px;
			background: #f7f7f7;
			text-shadow: none;
			font-weight: 600;
			font-size: 13px;
			line-height: normal; /* IE8-IE11 need this for buttons */
			color: #0073aa; /* some of these controls are button elements and don't inherit from links */
			cursor: pointer;
			outline: 0;
		}

		.split-page-title-action a:hover,
		.split-page-title-action .expander:hover:after {
			border-color: #008EC2;
			background: #00a0d2;
			color: #fff;
		}

		.split-page-title-action a:focus,
		.split-page-title-action .expander:focus:after {
			border-color: #5b9dd9;
			box-shadow: 0 0 2px rgba( 30, 140, 190, 0.8 );
		}

		.split-page-title-action .expander:after {
			content: "\f140";
			font: 400 20px/.5 dashicons;
			speak: none;
			top: 1px;
			<?php if ( is_rtl() ) : ?>
			right: -1px;
			<?php else : ?>
			left: -1px;
			<?php endif; ?>
			position: relative;
			vertical-align: top;
			text-decoration: none !important;
			padding: 4px 5px 4px 3px;
		}

		.split-page-title-action .dropdown {
			display: none;
		}

		.split-page-title-action .dropdown.visible {
			display: block;
			position: absolute;
			margin-top: 3px;
			z-index: 1;
		}

		.split-page-title-action .dropdown.visible a {
			display: block;
			top: 0;
			margin: -1px 0;
			<?php if ( is_rtl() ) : ?>
			padding-left: 9px;
			<?php else : ?>
			padding-right: 9px;
			<?php endif; ?>
		}

	</style>
	<script type="text/javascript">
		document.addEventListener( 'DOMContentLoaded', function() {
			var buttons = document.getElementsByClassName( 'page-title-action' ),
				button = buttons.item( 0 );

			if ( ! button ) {
				return;
			}

			var url = button.href;
			var urlHasParams = ( -1 !== url.indexOf( '?' ) );
			var classicUrl = url + ( urlHasParams ? '&' : '?' ) + 'classic-editor';

			var newbutton = '<span id="split-page-title-action" class="split-page-title-action">';
			newbutton += '<a href="' + url + '">' + button.innerText + '</a>';
			newbutton += '<span class="expander" tabindex="0" role="button" aria-haspopup="true" aria-label="<?php echo esc_js( __( 'Toggle editor selection menu', 'gutenberg' ) ); ?>"></span>';
			newbutton += '<span class="dropdown"><a href="' + url + '">Gutenberg</a>';
			newbutton += '<a href="' + classicUrl + '"><?php echo esc_js( __( 'Classic Editor', 'gutenberg' ) ); ?></a></span></span><span class="page-title-action" style="display:none;"></span>';

			button.insertAdjacentHTML( 'afterend', newbutton );
			button.remove();

			var expander = document.getElementById( 'split-page-title-action' ).getElementsByClassName( 'expander' ).item( 0 );
			expander.addEventListener( 'click', function( e ) {
				e.preventDefault();
				e.target.parentNode.getElementsByClassName( 'dropdown' ).item( 0 ).classList.toggle( 'visible' );
			} );
			expander.addEventListener( 'keydown', function( e ) {
				if ( 13 === e.which || 32 === e.which ) {
					e.preventDefault();
					e.target.parentNode.getElementsByClassName( 'dropdown' ).item( 0 ).classList.toggle( 'visible' );
				}
			} );
		} );
	</script>
	<?php
}
add_action( 'admin_print_scripts-edit.php', 'gutenberg_replace_default_add_new_button' );

/**
 * Adds the gutenberg-editor-page class to the body tag on the Gutenberg page.
 *
 * @since 1.5.0
 *
 * @param string $classes Space seperated string of classes being added to the body tag.
 * @return string The $classes string, with gutenberg-editor-page appended.
 */
function gutenberg_add_admin_body_class( $classes ) {
	return "$classes gutenberg-editor-page";
}
