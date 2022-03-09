<?php

function gutenberg_export_theme_zip() {
	// This is a way to trigger the zip when the form is submitted.
	// There must be a nicer way to do it!
	if ( strpos( $_SERVER['PHP_SELF'], 'wp-admin/export.php' ) > 0 && $_GET['theme_export_type'] ) {
		$editor_settings_controller = new Gutenberg_REST_Edit_Site_Export_Controller();
		if ( $_GET['theme_export_type'] === 'copy' ) {
			$theme_export_type = 'copy';
		}

		if ( $_GET['theme_export_type'] === 'templates-styles' ) {
			$theme_export_type = 'templates-styles';
		}

		$editor_settings_controller->export( $theme_export_type );
		die();
	}
}
add_action( 'admin_init', 'gutenberg_export_theme_zip' );

function export_theme() {
	submit_button( __( 'Download Export File' ), 'primary not-hidden' );
?>
	</form>
	<style>.submit input:not(.not-hidden) { display: none }</style>
	<h1><?php echo esc_html( 'Export theme' ); ?></h1>
	<h2><?php _e( 'Choose what to export' ); ?></h2>
	<form method="get" id="export-theme">
		<fieldset>
			<legend class="screen-reader-text"><?php _e( 'Theme export options' ); ?></legend>
			<p><label><input type="radio" name="theme_export_type" value="copy" aria-describedby="copy-theme-desc" checked="checked" /> <?php _e( 'A copy of your currently active theme' ); ?></label></p>
			<p class="description" id="copy-theme-desc"><?php _e( 'This will download a copy of your currently active theme with you template and style edits applied.' ); ?></p>
			<p><label><input type="radio" name="theme_export_type" value="templates-styles" /> <?php _e( 'Templates and styles only' ); ?></label></p>
		</fieldset>
<?php
	submit_button( __( 'Download Theme Files' ), 'primary not-hidden' );
}
add_action( 'export_filters', 'export_theme' );
