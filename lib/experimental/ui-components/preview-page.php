<?php
/**
 * Preview page for server-rendered `@wordpress/ui` components (Tools → UI
 * Components).
 *
 * @package gutenberg
 */

/**
 * Adds the preview page under Tools.
 */
function gutenberg_ui_components_add_preview_page() {
	add_management_page(
		__( 'UI Components', 'gutenberg' ),
		__( 'UI Components', 'gutenberg' ),
		'manage_options',
		'gutenberg-ui-components',
		'gutenberg_ui_components_render_preview_page'
	);
}
add_action( 'admin_menu', 'gutenberg_ui_components_add_preview_page' );

/**
 * Loads the component styles in the head of the preview page.
 *
 * @param string $hook_suffix Current admin page.
 */
function gutenberg_ui_components_enqueue_preview_assets( $hook_suffix ) {
	if ( 'tools_page_gutenberg-ui-components' === $hook_suffix ) {
		gutenberg_ui_components_enqueue_assets();
	}
}
add_action( 'admin_enqueue_scripts', 'gutenberg_ui_components_enqueue_preview_assets' );

/**
 * Prints component HTML. Components escape their own output.
 *
 * @param string $html Component HTML.
 */
function gutenberg_ui_components_print( $html ) {
	echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Renders the preview page.
 */
function gutenberg_ui_components_render_preview_page() {
	$manifest = gutenberg_ui_components_get_manifest();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'UI Components', 'gutenberg' ); ?></h1>

		<?php if ( ! $manifest ) : ?>
			<div class="notice notice-warning">
				<p><?php esc_html_e( 'The components haven’t been built yet. Run `npm run build`, then reload this page.', 'gutenberg' ); ?></p>
			</div>
		</div>
			<?php
			return;
		endif;
		?>

		<p><?php esc_html_e( 'Components from @wordpress/ui, rendered by PHP.', 'gutenberg' ); ?></p>

		<h2><?php esc_html_e( 'In a classic screen', 'gutenberg' ); ?></h2>
		<form onsubmit="return false;">
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="gutenberg-ui-preview-title"><?php esc_html_e( 'Site title', 'gutenberg' ); ?></label></th>
					<td><input id="gutenberg-ui-preview-title" type="text" class="regular-text" value="My site" /></td>
				</tr>
			</table>
			<p class="submit">
				<?php
				gutenberg_ui_components_print(
					gutenberg_get_ui_component(
						'button',
						array( 'type' => 'submit' ),
						__( 'Save changes', 'gutenberg' )
					)
				);
				?>
				<input type="submit" class="button button-primary" value="<?php esc_attr_e( 'Classic button', 'gutenberg' ); ?>" />
			</p>
		</form>

		<h2><?php esc_html_e( 'Button', 'gutenberg' ); ?></h2>
		<table class="widefat striped" style="max-width: 960px;">
			<tbody>
				<?php foreach ( $manifest['button']['props']['tone']['enum'] as $tone ) : ?>
					<tr>
						<th scope="row"><code><?php echo esc_html( $tone ); ?></code></th>
						<?php foreach ( $manifest['button']['props']['variant']['enum'] as $variant ) : ?>
							<td>
								<?php
								gutenberg_ui_components_print(
									gutenberg_get_ui_component(
										'button',
										array(
											'tone'    => $tone,
											'variant' => $variant,
										),
										$variant
									)
								);
								?>
							</td>
						<?php endforeach; ?>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}
