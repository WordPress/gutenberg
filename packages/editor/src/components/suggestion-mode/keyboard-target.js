/**
 * Shared DOM-target helpers for the suggest-mode keyboard interceptors
 * (`suggestion-addition-keyboard.js`, `suggestion-deletion-keyboard.js`).
 */

/**
 * Collect every document the editor canvas might live in: the top document and
 * the contents of each (same-origin) iframe. The canvas is usually iframed and
 * native input events don't cross that boundary, so the listener has to be
 * attached to the canvas document directly. The handlers' own guards keep them
 * from acting on edits outside a block's rich text, so attaching broadly is
 * safe.
 *
 * @return {Document[]} Candidate documents.
 */
export function getCandidateDocuments() {
	const docs = [ document ];
	for ( const iframe of document.querySelectorAll( 'iframe' ) ) {
		let doc = null;
		try {
			doc = iframe.contentDocument;
		} catch {
			// Cross-origin iframe — not the editor canvas; skip.
			doc = null;
		}
		if ( doc && ! docs.includes( doc ) ) {
			docs.push( doc );
		}
	}
	return docs;
}
