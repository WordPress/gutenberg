<?php
	$plugin_url   = plugin_dir_url( __DIR__ );
	$src_proc_ins = $plugin_url . 'tovdom/processing-instructions.js';
	$src_cdata    = $plugin_url . 'tovdom/cdata.js';

?>
<div data-wp-island>
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

	<script src="<?= $src_proc_ins ?>"></script>

	<div data-testid="it should replace CDATA with text nodes">
		<div id="replace-with-cdata"></div>
	</div>

	<script src="<?= $src_cdata ?>"></script>
</div>
