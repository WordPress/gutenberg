<?php
/**
 * Enable theme previews in the Site Editor for block themes.
 *
 * @package gutenberg
 */

/**
 * Filters the blog option to return the path for the previewed theme.
 *
 * @param string $current_stylesheet The current theme's stylesheet or template path.
 * @return string The previewed theme's stylesheet or template path.
 */
function gutenberg_get_theme_preview_path( $current_stylesheet = null ) {
	// Don't allow non-admins to preview themes.
	if ( ! current_user_can( 'switch_themes' ) ) {
		return $current_stylesheet;
	}

	$preview_stylesheet = ! empty( $_GET['gutenberg_theme_preview'] ) ? $_GET['gutenberg_theme_preview'] : null;
	$wp_theme           = wp_get_theme( $preview_stylesheet );
	if ( ! is_wp_error( $wp_theme->errors() ) ) {
		if ( current_filter() === 'template' ) {
			$theme_path = $wp_theme->get_template();
		} else {
			$theme_path = $wp_theme->get_stylesheet();
		}

		return sanitize_text_field( $theme_path );
	}

	return $current_stylesheet;
}

/**
 * Adds a middleware to the REST API to set the theme for the preview.
 */
function gutenberg_attach_theme_preview_middleware() {
	// Don't allow non-admins to preview themes.
	if ( ! current_user_can( 'switch_themes' ) ) {
		return;
	}

	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createThemePreviewMiddleware( %s ) );',
			wp_json_encode( sanitize_text_field( $_GET['gutenberg_theme_preview'] ) )
		),
		'after'
	);
}

/**
 * Temporary function to add a live preview button to block themes.
 * Remove when https://core.trac.wordpress.org/ticket/58190 lands.
 */
function add_live_preview_button() {
	global $pagenow;
	if ( 'themes.php' === $pagenow ) {
		?>
<script type="text/javascript">
	jQuery( document ).ready( function() {
		addLivePreviewButton();
		//themes are loaded as we scroll so we need to add the button to the newer ones.
		jQuery('.themes').on('DOMSubtreeModified', function(){
			addLivePreviewButton();
		});
	});
	function addLivePreviewButton() {
		document.querySelectorAll('.theme').forEach((el, index) => {
			const themeInfo = el.querySelector('.theme-id-container');
			const canAddButton =
				!themeInfo ||
				el.classList.contains('active') ||
				themeInfo.querySelector('.theme-actions')?.childElementCount > 1;
			if ( canAddButton ) {
				return;
			}
			const themePath = themeInfo.querySelector('h2.theme-name').id.replace('-name', '');
			const themeName = themeInfo.querySelector('h2.theme-name').innerText;
			const livePreviewButton = document.createElement('a');
			<?php
				/* translators: %s: theme name */
				$button_label = esc_attr_x( 'Live Preview %s', 'theme' );
			?>
			livePreviewButton.setAttribute('aria-label', '<?php echo $button_label; ?>'.replace('%s', themeName));
			livePreviewButton.setAttribute('class', 'button button-primary');
			livePreviewButton.setAttribute(
				'href',
				`/wp-admin/site-editor.php?gutenberg_theme_preview=${themePath}&return=themes.php`
			);
			livePreviewButton.innerHTML = '<?php echo esc_html_e( 'Live Preview' ); ?>';
			themeInfo.querySelector('.theme-actions').appendChild(livePreviewButton);
		});
	}
</script>
		<?php
	}

}

/**
 * Adds a nonce for the theme activation link.
 */
function block_theme_activate_nonce() {
	$nonce_handle = 'switch-theme_' . gutenberg_get_theme_preview_path();
	?>
<script type="text/javascript">
	window.BLOCK_THEME_ACTIVATE_NONCE = '<?php echo wp_create_nonce( $nonce_handle ); ?>';
</script>
	<?php
}

/**
 * Attaches filters to enable theme previews in the Site Editor.
 */
if ( ! empty( $_GET['gutenberg_theme_preview'] ) ) {
	add_filter( 'stylesheet', 'gutenberg_get_theme_preview_path' );
	add_filter( 'template', 'gutenberg_get_theme_preview_path' );
	add_filter( 'init', 'gutenberg_attach_theme_preview_middleware' );
}

add_action( 'admin_head', 'block_theme_activate_nonce' );
add_action( 'admin_print_footer_scripts', 'add_live_preview_button', 11 );

