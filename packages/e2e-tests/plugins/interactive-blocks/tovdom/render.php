<?php
/**
 * HTML for testing the vDOM generation.
 *
 * @package gutenberg-test-interactive-blocks
 */

$plugin_url   = plugin_dir_url( __DIR__ );
$src_proc_ins = $plugin_url . 'tovdom/processing-instructions.js';
$src_cdata    = $plugin_url . 'tovdom/cdata.js';

wp_enqueue_script_module( 'tovdom-view' );
?>

<div data-wp-interactive='{ "namespace": "tovdom" }'>
	<div data-testid="it should delete comments">
		<!-- ##1## -->
		<div data-testid="it should keep this node between comments">
			Comments inner node
			<!-- ##2## -->
		</div>
	</div>

	<div data-testid="it should delete processing instructions">
		<div id="replace-with-processing-instructions"></div>
	</div>

	<script src="<?php echo $src_proc_ins; ?>"></script>

	<div data-testid="it should replace CDATA with text nodes">
		<div id="replace-with-cdata"></div>
	</div>

	<script src="<?php echo $src_cdata; ?>"></script>
</div>
