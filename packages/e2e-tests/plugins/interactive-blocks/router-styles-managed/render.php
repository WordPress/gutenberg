<?php
/**
 * HTML for testing the iAPI's style assets management when the server marks
 * its style assets with the `data-wp-router-managed` attribute.
 *
 * The marking is done in `router-managed-styles.php`, which simulates the
 * WordPress core feature that is not available in the WordPress version
 * bundled with `wp-env`.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style(
			'managed-wrapper-styles-from-link',
			plugin_dir_url( __FILE__ ) . 'style-from-link.css',
			array()
		);

		$custom_css = '
			.managed-from-inline {
				color: rgb(128, 0, 128);
			}
		';

		wp_register_style( 'test-router-styles-managed', false );
		wp_enqueue_style( 'test-router-styles-managed' );
		wp_add_inline_style( 'test-router-styles-managed', $custom_css );
	}
);

$links              = isset( $attributes['links'] ) ? $attributes['links'] : array();
$injected_style_url = plugin_dir_url( __FILE__ ) . 'style-injected.css';
$wrapper_attributes = get_block_wrapper_attributes();
?>
<div <?php echo $wrapper_attributes; ?>>
	<!-- These get colored when the corresponding inner block is present. -->
	<fieldset>
		<legend>Styles from inner block styles</legend>
		<p data-testid="red" class="red">Red</p>
		<p data-testid="green" class="green">Green</p>
		<p data-testid="blue" class="blue">Blue</p>
	</fieldset>

	<!-- These are colored by the style assets of this very block, present in every page containing it. -->
	<fieldset>
		<legend>Styles from this block's own assets</legend>
		<p data-testid="managed-from-link" class="managed-from-link">Managed from link</p>
		<p data-testid="managed-from-inline" class="managed-from-inline">Managed from inline</p>
	</fieldset>

	<!-- These are only colored by style assets injected by the client. -->
	<fieldset>
		<legend>Targets for client-injected styles</legend>
		<p data-testid="injected" class="injected-target">Injected</p>
		<p data-testid="injected-from-link" class="injected-from-link-target">Injected from link</p>
	</fieldset>

	<!-- URL of a style sheet the server never enqueues, so tests can inject it from the client. -->
	<div
		data-testid="injected-style-sheet"
		data-url="<?php echo esc_url( $injected_style_url ); ?>"
		hidden
	></div>

	<!-- Links to pages with different blocks combination. -->
	<nav data-wp-interactive="test/router-styles-managed">
		<?php foreach ( $links as $label => $link ) : ?>
			<a
				data-testid="link <?php echo $label; ?>"
				data-wp-on--click="actions.navigate"
				href="<?php echo $link; ?>"
			>
				<?php echo $label; ?>
			</a>
		<?php endforeach; ?>
	</nav>

	<!-- HTML updated on navigation. -->
	<div
		data-wp-interactive="test/router-styles-managed"
		data-wp-router-region="router-styles"
	>
		<?php echo $content; ?>
	</div>

	<!-- Flag to check whether hydration has occurred. -->
	<div
		data-testid="hydrated"
		data-wp-interactive="test/router-styles-managed"
		data-wp-bind--hidden="!state.hydrated"
		data-wp-init="callbacks.setHydrated"
		hidden
	>
		Hydrated
	</div>

	<!-- Text to check whether a navigation was client-side. -->
	<div
		data-testid="client-side navigation"
		data-wp-interactive="test/router-styles-managed"
		data-wp-bind--hidden="!state.clientSideNavigation"
		hidden
	>
		Client-side navigation
	</div>
</div>
