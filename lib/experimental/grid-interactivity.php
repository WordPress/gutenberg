<?php
/**
 * Turns on the grid interactivity experiment in the block supports.
 *
 * @package gutenberg
 */

/**
 * Tells the layout block support whether grid interactivity is on. The block
 * support files are copied to WordPress core, which has no experiments, so
 * they read the flag from a filter instead of checking the experiment.
 *
 * @param bool $enabled Whether grid interactivity is on.
 * @return bool Whether grid interactivity is on.
 */
function gutenberg_layout_enable_grid_interactivity( $enabled ) {
	return $enabled || gutenberg_is_experiment_enabled( 'gutenberg-grid-interactivity' );
}
add_filter( 'gutenberg_layout_has_grid_interactivity', 'gutenberg_layout_enable_grid_interactivity' );
