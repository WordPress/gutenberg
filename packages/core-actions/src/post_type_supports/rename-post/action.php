<?php
/**
 * The "Rename…" action, for the post types supporting `title`. Its
 * JavaScript parts (`isEligible` and `RenderModal`) are in `action.tsx`,
 * next to this file.
 *
 * @package WordPress
 */

return array(
	'label'             => __( 'Rename…', 'gutenberg' ),
	'modalHeader'       => __( 'Rename', 'gutenberg' ),
	'modalFocusOnMount' => 'firstContentElement',
);
