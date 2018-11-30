<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the new block editor in core.
 * Version: 4.6.1
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
 * The gutenberg and gutenberg__editor classNames are left for backward compatibility.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	global $post_type_object;
	?>
	<noscript>
		<div class="error" style="position:absolute;top:32px;z-index:40"><p>
		<?php
		// Using Gutenberg as Plugin.
		if ( is_plugin_active( 'gutenberg/gutenberg.php' ) ) {
			$current_url = esc_url( add_query_arg( 'classic-editor', true, $_SERVER['REQUEST_URI'] ) );
			printf(
				// Translators: link is to current page specify classic editor.
				__( 'The Block Editor requires JavaScript. You can use the <a href="%s">Classic Editor</a>.', 'gutenberg' ),
				$current_url
			);
		} else { // Using Gutenberg in Core.
			printf(
				/* translators: %s: https://wordpress.org/plugins/classic-editor/ */
				__( 'The Block Editor requires JavaScript. Please try the <a href="%s">Classic Editor plugin</a>.', 'gutenberg' ),
				__( 'https://wordpress.org/plugins/classic-editor/', 'gutenberg' )
			);
		}
		?>
		</p></div>
	</noscript>
	<div class="block-editor gutenberg">
		<h1 class="screen-reader-text"><?php echo esc_html( $post_type_object->labels->edit_item ); ?></h1>
		<div id="editor" class="block-editor__container gutenberg__editor"></div>
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
			__( 'Support', 'gutenberg' ),
			'edit_posts',
			__( 'https://wordpress.org/support/plugin/gutenberg', 'gutenberg' ),
		);

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
 * Checks whether we're currently loading a Gutenberg page
 *
 * @return boolean Whether Gutenberg is being loaded.
 *
 * @since 3.1.0
 */
function is_gutenberg_page() {
	global $post;

	if ( ! is_admin() ) {
		return false;
	}

	/*
	 * There have been reports of specialized loading scenarios where `get_current_screen`
	 * does not exist. In these cases, it is safe to say we are not loading Gutenberg.
	 */
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}

	if ( get_current_screen()->base !== 'post' ) {
		return false;
	}

	if ( isset( $_GET['classic-editor'] ) ) {
		return false;
	}

	if ( ! gutenberg_can_edit_post( $post ) ) {
		return false;
	}

	return true;
}

/**
 * Display a version notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	_e( 'Gutenberg requires WordPress 4.9.8 or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' );
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
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor , then load it.
 *
 * @since 1.5.0
 */
function gutenberg_pre_init() {
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( dirname( __FILE__ ) . '/build/blocks' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	if ( version_compare( $version, '4.9.8', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
		return;
	}

	require_once dirname( __FILE__ ) . '/lib/load.php';

	if ( function_exists( 'gutenberg_silence_rest_errors' ) ) {
		gutenberg_silence_rest_errors();
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
	global $title, $post_type;

	if ( true === $return && current_filter() === 'replace_editor' ) {
		return $return;
	}

	if ( ! is_gutenberg_page() ) {
		return false;
	}

	add_action( 'admin_enqueue_scripts', 'gutenberg_editor_scripts_and_styles' );
	add_filter( 'screen_options_show_screen', '__return_false' );
	add_filter( 'admin_body_class', 'gutenberg_add_admin_body_class' );

	$post_type_object = get_post_type_object( $post_type );

	/*
	 * Always force <title> to 'Edit Post' (or equivalent)
	 * because it needs to be in a generic state for both
	 * post-new.php and post.php?post=<id>.
	 */
	if ( ! empty( $post_type_object ) ) {
		$title = $post_type_object->labels->edit_item;
	}

	/*
	 * Remove the emoji script as it is incompatible with both React and any
	 * contenteditable fields.
	 */
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );

	/*
	 * Ensure meta box functions are available to third-party code;
	 * includes/meta-boxes is typically loaded from edit-form-advanced.php.
	 */
	require_once ABSPATH . 'wp-admin/includes/meta-boxes.php';
	gutenberg_collect_meta_box_data();

	require_once ABSPATH . 'wp-admin/admin-header.php';
	the_gutenberg_project();

	return true;
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
	// Build the classic edit action. See also: WP_Posts_List_Table::handle_row_actions().
	$title = _draft_or_post_title( $post->ID );

	if ( 'wp_block' === $post->post_type ) {
		unset( $actions['inline hide-if-no-js'] );

		// Export uses block raw content, which is only returned from the post
		// REST endpoint via `context=edit`, requiring edit capability.
		$post_type = get_post_type_object( $post->post_type );
		if ( ! current_user_can( $post_type->cap->edit_post, $post->ID ) ) {
			return $actions;
		}

		$actions['export'] = sprintf(
			'<button type="button" class="wp-list-reusable-blocks__export button-link" data-id="%s" aria-label="%s">%s</button>',
			$post->ID,
			esc_attr(
				sprintf(
					/* translators: %s: post title */
					__( 'Export &#8220;%s&#8221; as JSON', 'gutenberg' ),
					$title
				)
			),
			__( 'Export as JSON', 'gutenberg' )
		);
		return $actions;
	}

	if ( ! gutenberg_can_edit_post( $post ) ) {
		return $actions;
	}

	$edit_url = get_edit_post_link( $post->ID, 'raw' );
	$edit_url = add_query_arg( 'classic-editor', '', $edit_url );

	$edit_action = array(
		'classic' => sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			esc_url( $edit_url ),
			esc_attr(
				sprintf(
					/* translators: %s: post title */
					__( 'Edit &#8220;%s&#8221; in the classic editor', 'gutenberg' ),
					$title
				)
			),
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
 * Removes the Edit action from the reusable block list's Bulk Actions dropdown.
 *
 * @since 3.8.0
 *
 * @param array $actions Bulk actions.
 *
 * @return array Updated bulk actions.
 */
function gutenberg_block_bulk_actions( $actions ) {
	unset( $actions['edit'] );
	return $actions;
}
add_filter( 'bulk_actions-edit-wp_block', 'gutenberg_block_bulk_actions' );

/**
 * Prints the JavaScript to replace the default "Add New" button.$_COOKIE
 *
 * @since 1.5.0
 */
function gutenberg_replace_default_add_new_button() {
	global $typenow;

	if ( 'wp_block' === $typenow ) {
		?>
		<style type="text/css">
			.page-title-action {
				display: none;
			}
		</style>
		<?php
	}

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

		.split-page-title-action .expander {
			outline: none;
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
			button.parentNode.removeChild( button );

			var expander = document.getElementById( 'split-page-title-action' ).getElementsByClassName( 'expander' ).item( 0 );
			var dropdown = expander.parentNode.querySelector( '.dropdown' );
			function toggleDropdown() {
				dropdown.classList.toggle( 'visible' );
			}
			expander.addEventListener( 'click', function( e ) {
				e.preventDefault();
				toggleDropdown();
			} );
			expander.addEventListener( 'keydown', function( e ) {
				if ( 13 === e.which || 32 === e.which ) {
					e.preventDefault();
					toggleDropdown();
				}
			} );
		} );
	</script>
	<?php
}
add_action( 'admin_print_scripts-edit.php', 'gutenberg_replace_default_add_new_button' );

/**
 * Adds the block-editor-page class to the body tag on the Gutenberg page.
 *
 * @since 1.5.0
 *
 * @param string $classes Space separated string of classes being added to the body tag.
 * @return string The $classes string, with block-editor-page appended.
 */
function gutenberg_add_admin_body_class( $classes ) {
	// gutenberg-editor-page is left for backward compatibility.
	if ( current_theme_supports( 'editor-styles' ) && current_theme_supports( 'dark-editor-style' ) ) {
		return "$classes block-editor-page gutenberg-editor-page is-fullscreen-mode wp-embed-responsive is-dark-theme";
	} else {
		// Default to is-fullscreen-mode to avoid jumps in the UI.
		return "$classes block-editor-page gutenberg-editor-page is-fullscreen-mode wp-embed-responsive";
	}
}

/**
 * Adds attributes to kses allowed tags that aren't in the default list
 * and that Gutenberg needs to save blocks such as the Gallery block.
 *
 * @param array $tags Allowed HTML.
 * @return array (Maybe) modified allowed HTML.
 */
function gutenberg_kses_allowedtags( $tags ) {
	if ( isset( $tags['img'] ) ) {
		$tags['img']['data-link'] = true;
		$tags['img']['data-id']   = true;
	}
	return $tags;
}

add_filter( 'wp_kses_allowed_html', 'gutenberg_kses_allowedtags', 10, 2 );

/**
 * Adds the wp-embed-responsive class to the body tag if the theme has opted in to
 * Gutenberg responsive embeds.
 *
 * @since 4.1.0
 *
 * @param Array $classes Array of classes being added to the body tag.
 * @return Array The $classes array, with wp-embed-responsive appended.
 */
function gutenberg_add_responsive_body_class( $classes ) {
	if ( current_theme_supports( 'responsive-embeds' ) ) {
		$classes[] = 'wp-embed-responsive';
	}
	return $classes;
}

add_filter( 'body_class', 'gutenberg_add_responsive_body_class' );
