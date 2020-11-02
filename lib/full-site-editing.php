<?php
/**
 * Full Site Editing Utils
 *
 * @package gutenberg
 */

/**
 * Returns whether the current theme is an FSE theme or not.
 *
 * @return boolean Whether the current theme is an FSE theme or not.
 */
function gutenberg_is_fse_theme() {
	return is_readable( STYLESHEETPATH . '/block-templates/index.html' );
}

/**
 * Show a notice when a Full Site Editing theme is used.
 */
function gutenberg_full_site_editing_notice() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}
	?>
	<div class="notice notice-warning">
		<p><?php _e( 'You\'re using an experimental Full Site Editing theme. Full Site Editing is an experimental feature and potential API changes are to be expected!', 'gutenberg' ); ?></p>
	</div>
	<?php
}
add_action( 'admin_notices', 'gutenberg_full_site_editing_notice' );
