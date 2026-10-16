<?php
/**
 * The "Set as posts page…" action, for pages, when the user can manage the
 * site settings. Its JavaScript parts (`isEligible` and `RenderModal`) are in
 * `action.tsx`, next to this file.
 *
 * @package WordPress
 */

return array(
	'label'             => __( 'Set as posts page…', 'gutenberg' ),
	'modalHeader'       => __( 'Set as posts page', 'gutenberg' ),
	'modalFocusOnMount' => 'firstContentElement',
);
