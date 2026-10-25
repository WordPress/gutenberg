import deprecated from '@wordpress/deprecated';

/**
 * Returns false because the deprecated reusable blocks package no longer tracks
 * editing state.
 *
 * @return {boolean} Whether the reusable block is in the editing state.
 */
export function __experimentalIsEditingReusableBlock() {
	deprecated(
		"wp.data.select( 'core/reusable-blocks' ).__experimentalIsEditingReusableBlock",
		{
			since: '7.1',
		}
	);
	return false;
}
