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
