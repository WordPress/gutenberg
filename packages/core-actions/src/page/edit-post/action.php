<?php
/**
 * The "Edit" action, for pages, when the user can edit them. Only the lists
 * of pages show it. Its JavaScript parts (`icon`, `isEligible`, and
 * `callback`) are in `action.tsx`, next to this file.
 *
 * The action does not open the page by itself: the screen listing the pages
 * navigates to the editor from its `onActionPerformed` handler.
 *
 * @package WordPress
 */

return array(
	'label'   => _x( 'Edit', 'verb' ),
	'context' => 'list',
);
