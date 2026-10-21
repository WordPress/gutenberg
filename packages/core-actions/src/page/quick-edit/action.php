<?php
/**
 * The "Quick edit" action, for the pages the user can edit. Only the lists
 * show it. Its JavaScript parts (`label`, `icon`, `isEligible`, and
 * `callback`) are in `action.tsx`, next to this file.
 *
 * The action does not open the quick edit form by itself: the screen listing
 * the pages opens it from its `onActionPerformed` handler.
 *
 * @package WordPress
 */

return array(
	'label'        => __( 'Quick edit' ),
	'context'      => 'list',
	'isPrimary'    => true,
	'supportsBulk' => true,
);
