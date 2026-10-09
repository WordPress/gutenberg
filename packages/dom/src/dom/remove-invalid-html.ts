import cleanNodeList from './clean-node-list';
import type { Schema } from './types';

/**
 * Given a schema, unwraps or removes nodes, attributes and classes on HTML.
 *
 * @param {string}  HTML   The HTML to clean up.
 * @param {Schema}  schema Schema for the HTML.
 * @param {boolean} inline Whether to clean for inline mode.
 *
 * @return {string} The cleaned up HTML.
 */
export default function removeInvalidHTML(
	HTML: string,
	schema: Schema,
	inline: boolean
): string {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	cleanNodeList( doc.body.childNodes, doc, schema, inline );

	return doc.body.innerHTML;
}
