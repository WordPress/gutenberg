import deprecated from '@wordpress/deprecated';

/**
 * Returns a no-op thunk. This package is deprecated and converting reusable
 * blocks is now handled elsewhere, but the action remains for backward
 * compatibility.
 */
export const __experimentalConvertBlockToStatic = () => () => {
	deprecated(
		"wp.data.dispatch( 'core/reusable-blocks' ).__experimentalConvertBlockToStatic",
		{
			since: '7.1',
		}
	);
};

/**
 * Returns a no-op thunk. This package is deprecated and converting blocks into
 * patterns is now handled elsewhere, but the action remains for backward
 * compatibility.
 */
export const __experimentalConvertBlocksToReusable = () => async () => {
	deprecated(
		"wp.data.dispatch( 'core/reusable-blocks' ).__experimentalConvertBlocksToReusable",
		{
			since: '7.1',
		}
	);
};

/**
 * Returns a no-op thunk. This package is deprecated and deleting reusable
 * blocks is now handled elsewhere, but the action remains for backward
 * compatibility.
 */
export const __experimentalDeleteReusableBlock = () => async () => {
	deprecated(
		"wp.data.dispatch( 'core/reusable-blocks' ).__experimentalDeleteReusableBlock",
		{
			since: '7.1',
		}
	);
};

/**
 * Returns a no-op thunk. This package is deprecated and tracking the editing
 * state of reusable blocks is no longer handled here, but the action remains
 * for backward compatibility.
 */
export const __experimentalSetEditingReusableBlock = () => () => {
	deprecated(
		"wp.data.dispatch( 'core/reusable-blocks' ).__experimentalSetEditingReusableBlock",
		{
			since: '7.1',
		}
	);
};
