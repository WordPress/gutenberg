<?php
/**
 * HTML for testing the iAPI's style assets management.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style(
			'red-from-link',
			plugin_dir_url( __FILE__ ) . 'style-from-link.css',
			array()
		);

		$custom_css = '
			.red-from-inline {
				color: rgb(255, 0, 0);
			}
		';

		wp_register_style( 'test-router-styles', false );
		wp_enqueue_style( 'test-router-styles' );
		wp_add_inline_style( 'test-router-styles', $custom_css );
	}
);

/*
 * Style sheet loaded asynchronously with the "print trick" that optimization
 * plugins use: the element is downloaded without applying, and the inline
 * handler switches the media to `all` once it is ready.
 *
 * The markup is printed directly instead of enqueued because
 * `wp_enqueue_style()` cannot output the `onload` attribute. It is printed in
 * `wp_head` so it stays outside of the router regions, which are re-rendered
 * by the vdom.
 */
add_action(
	'wp_head',
	function () {
		printf(
			'<link rel="stylesheet" href="%s" media="print" onload="this.onload=null;this.media=\'all\'">',
			esc_url( plugin_dir_url( __FILE__ ) . 'style-async-print.css' )
		);
	}
);

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'data-testid' => 'red-block' )
);
?>
<p <?php echo $wrapper_attributes; ?>>Red</p>

<noscript>
	<style>
		.noscript-style-test {
			color: rgb(255, 0, 0) !important;
			font-weight: bold !important;
		}
	</style>
</noscript>
