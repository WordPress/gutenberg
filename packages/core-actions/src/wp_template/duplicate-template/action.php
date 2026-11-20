<?php
/**
 * The "Duplicate" action of custom templates, when the current user can
 * create templates and the theme is a block theme. Its JavaScript parts
 * (`isEligible` and `RenderModal`) are in `action.tsx`, next to this file.
 *
 * @package WordPress
 */

return array(
	'label'             => _x( 'Duplicate', 'action label' ),
	'modalHeader'       => _x( 'Duplicate template', 'action label' ),
	'modalFocusOnMount' => 'firstContentElement',
);
