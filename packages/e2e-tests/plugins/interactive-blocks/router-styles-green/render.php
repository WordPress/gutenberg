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
			'green-from-link',
			plugin_dir_url( __FILE__ ) . 'style-from-link.css',
			array()
		);

		$custom_css = '
			.green-from-inline {
				color: rgb(0, 255, 0);
			}
		';

		wp_register_style( 'test-router-styles', false );
		wp_enqueue_style( 'test-router-styles' );
		wp_add_inline_style( 'test-router-styles', $custom_css );
	}
);

/*
 * Style sheet loaded asynchronously with the media stored in a data attribute:
 * the element does not apply to any media until the inline handler copies the
 * target media from `data-media` once it is ready.
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
			'<link rel="stylesheet" href="%s" media="not all" data-media="all" onload="this.media=this.dataset.media">',
			esc_url( plugin_dir_url( __FILE__ ) . 'style-async-data-media.css' )
		);
	}
);

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'data-testid' => 'green-block' )
);
?>
<p <?php echo $wrapper_attributes; ?>>Green</p>
