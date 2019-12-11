/**
 * External dependencies
 */
import { omit, without } from 'lodash';

/**
 * All text-level semantic elements.
 *
 * @see https://html.spec.whatwg.org/multipage/text-level-semantics.html
 */
const phrasingContentSchema = {
	strong: {},
	em: {},
	s: {},
	del: {},
	ins: {},
	a: { attributes: [ 'href', 'target', 'rel' ] },
	code: {},
	abbr: { attributes: [ 'title' ] },
	sub: {},
	sup: {},
	br: {},
	small: {},
	// To do: fix blockquote.
	// cite: {},
	q: { attributes: [ 'cite' ] },
	dfn: { attributes: [ 'title' ] },
	data: { attributes: [ 'value' ] },
	time: { attributes: [ 'datetime' ] },
	var: {},
	samp: {},
	kbd: {},
	i: {},
	b: {},
	u: {},
	mark: {},
	ruby: {},
	rt: {},
	rp: {},
	bdi: { attributes: [ 'dir' ] },
	bdo: { attributes: [ 'dir' ] },
	wbr: {},
	'#text': {},
};

// Recursion is needed.
// Possible: strong > em > strong.
// Impossible: strong > strong.
without( Object.keys( phrasingContentSchema ), '#text', 'br' ).forEach( ( tag ) => {
	phrasingContentSchema[ tag ].children = omit( phrasingContentSchema, tag );
} );

/**
 * Get schema of possible paths for phrasing content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
 *
 * @param {string} context Set to "paste" to exclude invisible elements and
 *                         sensitive data.
 *
 * @return {Object} Schema.
 */
export function getPhrasingContentSchema( context ) {
	if ( context !== 'paste' ) {
		return phrasingContentSchema;
	}

	return omit( {
		...phrasingContentSchema,
		// We shouldn't paste potentially sensitive information which is not
		// visible to the user when pasted, so strip the attributes.
		ins: { children: phrasingContentSchema.ins.children },
		del: { children: phrasingContentSchema.del.children },
	}, [
		'u', // Used to mark misspelling. Shouldn't be pasted.
		'abbr', // Invisible.
		'data', // Invisible.
		'time', // Invisible.
		'wbr', // Invisible.
		'bdi', // Invisible.
		'bdo', // Invisible.
	] );
}

/**
 * Find out whether or not the given node is phrasing content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
 *
 * @param {Element} node The node to test.
 *
 * @return {boolean} True if phrasing content, false if not.
 */
export function isPhrasingContent( node ) {
	const tag = node.nodeName.toLowerCase();
	return getPhrasingContentSchema().hasOwnProperty( tag ) || tag === 'span';
}
