<?php
/**
 * The "Set as homepage…" action, for pages, when the user can manage the
 * site settings. Its JavaScript parts (`isEligible` and `RenderModal`) are in
 * `action.tsx`, next to this file.
 *
 * @package WordPress
 */

return array(
	'label'             => __( 'Set as homepage…', 'gutenberg' ),
	'modalHeader'       => __( 'Set as homepage', 'gutenberg' ),
	'modalFocusOnMount' => 'firstContentElement',
);
