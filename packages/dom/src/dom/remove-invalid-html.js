/**
 * Internal dependencies
 */
import cleanNodeList from './clean-node-list';

/**
 * Given a schema, unwraps or removes nodes, attributes and classes on HTML.
 *
 * @param {string}                             HTML   The HTML to clean up.
 * @param {import('./clean-node-list').Schema} schema Schema for the HTML.
 * @param {boolean}                            inline Whether to clean for inline mode.
 *
 * @return {string} The cleaned up HTML.
 */
export default function removeInvalidHTML( HTML, schema, inline ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	cleanNodeList( doc.body.childNodes, doc, schema, inline );

	return doc.body.innerHTML;
}
