export { default as BlockVisibilityModal } from './modal';
export { default as useBlockVisibility } from './use-block-visibility';

import BlockVisibilityToolbarDefault from './toolbar';
import BlockVisibilityViewportToolbar from './viewport-toolbar';

import BlockVisibilityMenuItemDefault from './menu-item';
import BlockVisibilityViewportMenuItem from './viewport-menu-item';

import BlockVisibilityInfoDefault from './block-visibility-info';
import ViewportVisibilityInfo from './viewport-visibility-info';

const hasViewportVisibilityExperiment =
	typeof window !== 'undefined' &&
	window.__experimentalHideBlocksBasedOnScreenSize;

// Conditionally export the viewport versions when the experimental flag is enabled.
export const BlockVisibilityMenuItem = hasViewportVisibilityExperiment
	? BlockVisibilityViewportMenuItem
	: BlockVisibilityMenuItemDefault;

export const BlockVisibilityToolbar = hasViewportVisibilityExperiment
	? BlockVisibilityViewportToolbar
	: BlockVisibilityToolbarDefault;

export const BlockVisibilityInfo = hasViewportVisibilityExperiment
	? ViewportVisibilityInfo
	: BlockVisibilityInfoDefault;
