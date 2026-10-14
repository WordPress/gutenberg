<?php
/**
 * Preview page for server-rendered `@wordpress/ui` components (Tools → UI
 * Components).
 *
 * Shows the components in common classic admin contexts, and every example
 * the build generates next to the React render it comes from. Nothing here is
 * specific to a component, so new components show up without changes.
 *
 * @package gutenberg
 */

/**
 * Reads the React renders of each component's examples.
 *
 * @return array Examples, or an empty array when they haven't been built.
 */
function gutenberg_ui_components_get_examples() {
	$file = gutenberg_dir_path() . 'packages/ui/build-php/test/examples.json';
	if ( ! is_readable( $file ) ) {
		return array();
	}

	$examples = json_decode( (string) file_get_contents( $file ), true );
	return is_array( $examples ) ? $examples : array();
}

/**
 * Registers the preview page.
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
	if ( 'tools_page_gutenberg-ui-components' !== $hook_suffix ) {
		return;
	}

	if ( 'react' === gutenberg_ui_components_get_sample_mode() ) {
		wp_enqueue_style(
			'gutenberg-ui-preview-react',
			gutenberg_url( 'packages/ui/build-php/test/all-styles.css' ),
			array( 'wp-theme' ),
			(string) filemtime( gutenberg_dir_path() . 'packages/ui/build-php/test/all-styles.css' )
		);
		return;
	}

	gutenberg_ui_components()->enqueue_assets();
}

/**
 * Returns which render the page shows on its own, for the visual check.
 *
 * With `&sample=php` the page shows only the PHP render of each example, with
 * the PHP stylesheet. With `&sample=react` it shows only React's render, with
 * every stylesheet of the package instead, so a stylesheet the PHP build left
 * out shows up as a difference between the two.
 *
 * @return string 'php', 'react', or an empty string for the full page.
 */
function gutenberg_ui_components_get_sample_mode() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only display option.
	$mode = isset( $_GET['sample'] ) ? sanitize_key( $_GET['sample'] ) : '';
	return in_array( $mode, array( 'php', 'react' ), true ) ? $mode : '';
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
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'UI Components', 'gutenberg' ); ?></h1>

		<?php if ( ! gutenberg_ui_components()->is_available() ) : ?>
			<div class="notice notice-warning">
				<p><?php esc_html_e( 'The components haven’t been built yet. Run `npm run build`, then reload this page.', 'gutenberg' ); ?></p>
			</div>
			<?php
			return;
		endif;
		?>

		<?php
		$mode = gutenberg_ui_components_get_sample_mode();
		if ( $mode ) :
			foreach ( gutenberg_ui_components_get_examples() as $example ) :
				$html = 'php' === $mode ? gutenberg_get_ui_component( $example['component'], $example['props'] ) : $example['html'];
				?>
				<div class="gutenberg-ui-preview-sample" data-example="<?php echo esc_attr( $example['component'] . ': ' . $example['name'] ); ?>" style="width: 280px; margin-bottom: 16px;">
					<?php gutenberg_ui_components_print( $html ); ?>
				</div>
				<?php
			endforeach;
			echo '</div>';
			return;
		endif;
		?>

		<p><?php esc_html_e( 'Components from @wordpress/ui, rendered by PHP from markup generated from the React components.', 'gutenberg' ); ?></p>

		<h2><?php esc_html_e( 'In a classic screen', 'gutenberg' ); ?></h2>
		<form onsubmit="return false;">
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="gutenberg-ui-preview-title"><?php esc_html_e( 'Site title', 'gutenberg' ); ?></label></th>
					<td>
						<input id="gutenberg-ui-preview-title" type="text" class="regular-text" value="My site" />
					</td>
				</tr>
			</table>
			<p class="submit">
				<?php
				gutenberg_ui_components_print(
					gutenberg_get_ui_component(
						'button',
						array(
							'label' => __( 'Save changes', 'gutenberg' ),
							'type'  => 'submit',
						)
					)
				);
				?>
				<input type="submit" class="button button-primary" value="<?php esc_attr_e( 'Classic button', 'gutenberg' ); ?>" />
			</p>
		</form>

		<h2><?php esc_html_e( 'Examples', 'gutenberg' ); ?></h2>
		<table class="widefat striped" style="max-width: 960px;">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Example', 'gutenberg' ); ?></th>
					<th><?php esc_html_e( 'PHP', 'gutenberg' ); ?></th>
					<th><?php esc_html_e( 'React (static)', 'gutenberg' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( gutenberg_ui_components_get_examples() as $example ) : ?>
					<tr>
						<td><code><?php echo esc_html( $example['component'] . ': ' . $example['name'] ); ?></code></td>
						<td><?php gutenberg_ui_components_print( gutenberg_get_ui_component( $example['component'], $example['props'] ) ); ?></td>
						<td><?php gutenberg_ui_components_print( $example['html'] ); ?></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}
