<?php
	function gutenberg_experimental_global_grid( $settings ) {
		$settings['__experimentalGlobalGrid'] = true;
		return $settings;
	}

	add_filter( 'block_editor_settings', 'gutenberg_experimental_global_grid' );
