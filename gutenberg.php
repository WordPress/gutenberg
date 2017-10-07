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

add_filter( 'replace_editor', 'gutenberg_init', 10, 2 );
function gutenberg_init( $return, $post ) {
	$post_type = get_post_type( $post );

	if ( 'attachment' !== $post_type ) {
		require_once dirname( __FILE__ ) . '/lib/init-checks.php';

		if ( gutenberg_can_init() ) {
			require_once dirname( __FILE__ ) . '/lib/load.php';

			require_once( ABSPATH . 'wp-admin/admin-header.php' );
			the_gutenberg_project();

			return true;
		} else {
			return false;
		}
	}

	return false;
}
