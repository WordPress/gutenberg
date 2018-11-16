/**
 * Internal dependencies
 */
import { acceptPageDialog } from './accept-page-dialog';

/**
 * Enables even listener which accepts a page dialog which
 * may appear when navigating away from Gutenberg.
 */
export function enablePageDialogAccept() {
	page.on( 'dialog', acceptPageDialog );
}
