<?php
/**
 * The "Edit" action, for pages, templates, template parts, and patterns, when
 * the user can edit them. Only the lists show it. Its JavaScript parts
 * (`icon`, `isEligible`, and `callback`) are in `action.tsx`, next to this
 * file.
 *
 * The action does not open the post by itself: the screen listing the posts
 * navigates to the editor from its `onActionPerformed` handler.
 *
 * @package WordPress
 */

return array(
	'label'   => _x( 'Edit', 'verb' ),
	'context' => 'list',
);
