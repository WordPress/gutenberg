<?php
/**
 * The "Quick edit" action, for pages, in the lists of the screens: it opens
 * the quick edit form of the pages the way the screen does. Its JavaScript
 * parts (`label`, `icon`, `isEligible`, and `callback`) are in `action.tsx`,
 * next to this file.
 *
 * @package WordPress
 */

return array(
	'label'        => __( 'Quick edit' ),
	'context'      => 'list',
	'isPrimary'    => true,
	'supportsBulk' => true,
);
