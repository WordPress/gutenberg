/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * The block toolbar is not always visible while typing.
 * Call this function to reveal it.
 *
 * @param this
 */
export async function showBlockToolbar( this: Editor ) {
	// Move the mouse to disable the isTyping mode. We need at least three
	// mousemove events for it to work across windows (iframe). With three
	// moves, it's a guarantee that at least two will be in the same window.
	// Two events are required for the flag to be unset.
	await this.page.mouse.move( 50, 50 );
	await this.page.mouse.move( 75, 75 );
	await this.page.mouse.move( 100, 100 );
}
