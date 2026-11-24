export const globalStylesDataKey = Symbol( 'globalStylesDataKey' );
export const globalStylesLinksDataKey = Symbol( 'globalStylesLinks' );
export const selectBlockPatternsKey = Symbol( 'selectBlockPatternsKey' );
export const reusableBlocksSelectKey = Symbol( 'reusableBlocksSelect' );
export const currentUserIdSelectKey = Symbol( 'currentUserIdSelect' );
export const userPatternCategoriesSelectKey = Symbol(
	'userPatternCategoriesSelect'
);
export const sectionRootClientIdKey = Symbol( 'sectionRootClientIdKey' );
export const mediaEditKey = Symbol( 'mediaEditKey' );
export const getMediaSelectKey = Symbol( 'getMediaSelect' );
export const isIsolatedEditorKey = Symbol( 'isIsolatedEditor' );
export const deviceTypeKey = Symbol( 'deviceTypeKey' );
export const isNavigationOverlayContextKey = Symbol(
	'isNavigationOverlayContext'
);
export const isNavigationPostEditorKey = Symbol( 'isNavigationPostEditor' );
export const mediaUploadOnSuccessKey = Symbol( 'mediaUploadOnSuccess' );
export const mediaSideloadFromUrlKey = Symbol( 'mediaSideloadFromUrl' );
export const openMediaEditorModalKey = Symbol( 'openMediaEditorModal' );

/**
 * Private inner blocks option and block list setting: one-step moves (the
 * block movers and their keyboard shortcuts) treat the block as transparent.
 * Its children count as siblings of the blocks around it, so a neighbor moves
 * past one child at a time instead of past the whole block, and an edge child
 * can move out.
 */
export const isMoveTransparentKey = Symbol( 'isMoveTransparent' );

/**
 * Private inner blocks option and block list setting: the block stands in for
 * its inner blocks until they're edited. The first persistent change to them
 * also replaces the block with them, as part of the same change, so a single
 * undo step reverts both. Changes that aren't persistent, or are left out of
 * the undo history (such as an inner block controller resetting the inner
 * blocks), leave the block in place.
 */
export const detachesOnEditKey = Symbol( 'detachesOnEdit' );
