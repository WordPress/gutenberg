/**
 * Internal dependencies
 */
import { useDisableNonContentBlocks } from './use-disable-non-content-blocks';
import { useRemovePostFromContentBlockLabels } from './use-remove-post-from-content-block-labels';

/**
 * Component that when rendered, locks the site editor so that only page content
 * can be edited.
 */
export function PageContentLock() {
	useDisableNonContentBlocks();
	useRemovePostFromContentBlockLabels();
}

export { usePageContentLockNotifications } from './use-page-content-lock-notifications';
