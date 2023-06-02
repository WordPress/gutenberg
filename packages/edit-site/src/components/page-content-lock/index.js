/**
 * Internal dependencies
 */
import { useDisableNonContentBlocks } from './use-disable-non-content-blocks';

/**
 * Component that when rendered, locks the site editor so that only page content
 * can be edited.
 */
export function PageContentLock() {
	useDisableNonContentBlocks();
}

export { usePageContentLockNotifications } from './use-page-content-lock-notifications';
