/**
 * Parse the given HTML into a body element.
 *
 * Note: The current implementation will return a shared reference, reset on
 * each call to `createElement`. Therefore, you should not hold a reference to
 * the value to operate upon asynchronously, as it may have unexpected results.
 *
 * @param document                The HTML document to use to parse.
 * @param document.implementation The DOM implementation of the document.
 * @param html                    The HTML to parse.
 *
 * @return Body element with parsed HTML.
 */
export function createElement( { implementation }: Document, html: string ) {
	// Because `createHTMLDocument` is an expensive operation, and with this
	// function being internal to `rich-text` (full control in avoiding a risk
	// of asynchronous operations on the shared reference), a single document
	// is reused and reset for each call to the function.
	if ( ! createElement.body ) {
		createElement.body = implementation.createHTMLDocument( '' ).body;
	}

	createElement.body.innerHTML = html;

	return createElement.body;
}

export declare namespace createElement {
	/**
	 * The body element reused by every call.
	 */
	let body: HTMLElement | undefined;
}
