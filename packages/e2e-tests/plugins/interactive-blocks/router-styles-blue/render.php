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
			'blue-from-link',
			plugin_dir_url( __FILE__ ) . 'style-from-link.css',
			array()
		);

		$custom_css = '
			.blue-from-inline {
				color: rgb(0, 0, 255);
			}
		';

		wp_register_style( 'test-router-styles', false );
		wp_enqueue_style( 'test-router-styles' );
		wp_add_inline_style( 'test-router-styles', $custom_css );
	}
);

/*
 * Style sheets loaded asynchronously:
 *
 * - A `preload` that the inline handler turns into a style sheet once it is
 *   ready.
 * - A "print trick" style sheet that opts out of being disabled with
 *   `data-wp-router-style="persist"`, so it keeps applying after navigating to
 *   pages that don't contain it.
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
			'<link rel="preload" as="style" href="%s" onload="this.onload=null;this.rel=\'stylesheet\'">',
			esc_url( plugin_dir_url( __FILE__ ) . 'style-async-preload.css' )
		);
		printf(
			'<link rel="stylesheet" href="%s" media="print" onload="this.onload=null;this.media=\'all\'" data-wp-router-style="persist">',
			esc_url( plugin_dir_url( __FILE__ ) . 'style-async-persist.css' )
		);
	}
);

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'data-testid' => 'blue-block' )
);
?>
<p <?php echo $wrapper_attributes; ?>>Blue</p>

<noscript>
	<style>
		.noscript-style-test {
			color: rgb(0, 0, 255) !important;
			background-color: yellow !important;
		}
	</style>
</noscript>
