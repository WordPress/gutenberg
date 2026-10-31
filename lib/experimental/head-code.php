<?php
/**
 * Head code setting: lets administrators add markup to the site's <head>,
 * such as verification meta tags or analytics scripts, from Settings > General.
 *
 * The code is stored in a site option, so it is independent of the active
 * theme and of Global Styles.
 *
 * @package gutenberg
 */

/**
 * Registers the head code option.
 */
function gutenberg_register_head_code_setting() {
	register_setting(
		'general',
		'gutenberg_head_code',
		array(
			'type'              => 'string',
			'label'             => __( 'Head code', 'gutenberg' ),
			'description'       => __( 'Markup printed in the <head> of every front-end page.', 'gutenberg' ),
			'default'           => '',
			'sanitize_callback' => 'gutenberg_sanitize_head_code',
			'show_in_rest'      => false,
		)
	);
}
add_action( 'init', 'gutenberg_register_head_code_setting' );

/**
 * Keeps the stored head code when a logged-in user without `unfiltered_html`
 * tries to change it. Updates without a user, such as from WP-CLI, go through.
 *
 * On multisite, `unfiltered_html` is limited to Super Admins, and it is
 * removed for everyone when DISALLOW_UNFILTERED_HTML is set.
 *
 * @param string $value Submitted head code.
 * @return string Head code to store.
 */
function gutenberg_sanitize_head_code( $value ) {
	if ( is_user_logged_in() && ! current_user_can( 'unfiltered_html' ) ) {
		return (string) get_option( 'gutenberg_head_code', '' );
	}
	return trim( (string) $value );
}

/**
 * Adds the head code field to Settings > General.
 */
function gutenberg_add_head_code_settings_field() {
	if ( ! current_user_can( 'unfiltered_html' ) ) {
		return;
	}
	add_settings_field(
		'gutenberg_head_code',
		__( 'Head code', 'gutenberg' ),
		'gutenberg_render_head_code_settings_field',
		'general',
		'default',
		array( 'label_for' => 'gutenberg_head_code' )
	);
}
add_action( 'admin_init', 'gutenberg_add_head_code_settings_field' );

/**
 * Renders the head code field.
 */
function gutenberg_render_head_code_settings_field() {
	?>
	<textarea name="gutenberg_head_code" id="gutenberg_head_code" class="large-text code" rows="6" aria-describedby="gutenberg-head-code-description"><?php echo esc_textarea( get_option( 'gutenberg_head_code', '' ) ); ?></textarea>
	<p class="description" id="gutenberg-head-code-description">
		<?php
		echo esc_html(
			__( 'Added to the <head> of every page on your site, whatever the theme. Use it for verification meta tags or analytics scripts from services you trust: code here runs for every visitor and can break your site.', 'gutenberg' )
		);
		?>
	</p>
	<?php
}

/**
 * Prints the head code on the front end, after Additional CSS (priority 101).
 */
function gutenberg_print_head_code() {
	$head_code = get_option( 'gutenberg_head_code', '' );
	if ( '' === $head_code ) {
		return;
	}
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Only users with unfiltered_html can save it.
	echo $head_code . "\n";
}
add_action( 'wp_head', 'gutenberg_print_head_code', 102 );
