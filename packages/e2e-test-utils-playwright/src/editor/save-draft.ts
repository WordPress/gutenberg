/**
 * Internal dependencies
 */
import type { Editor } from './index';

export async function saveDraft( this: Editor ) {
	await this.page.waitForSelector( '.editor-post-save-draft' );
	await this.page.click( '.editor-post-save-draft' );

	await this.page.waitForSelector( '.components-snackbar' );
}
