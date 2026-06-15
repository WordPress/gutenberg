/**
 * All phrasing content elements.
 *
 * @see https://www.w3.org/TR/2011/WD-html5-20110525/content-models.html#phrasing-content-0
 */

/**
 * @typedef {Record<string,SemanticElementDefinition>} ContentSchema
 */

/**
 * @typedef SemanticElementDefinition
 * @property {string[]}          [attributes] Content attributes
 * @property {ContentSchema|'*'} [children]   Content attributes
 */

/**
 * All text-level semantic elements.
 *
 * @see https://html.spec.whatwg.org/multipage/text-level-semantics.html
 *
 * @type {ContentSchema}
 */
const textContentSchema = {
	strong: {},
	em: {},
	s: {},
	del: {},
	ins: {},
	a: { attributes: [ 'href', 'target', 'rel', 'id' ] },
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

/**
 * Embedded content elements.
 *
 * @see https://www.w3.org/TR/2011/WD-html5-20110525/content-models.html#embedded-content-0
 *
 * @type {ContentSchema}
 */
const embeddedContentSchema = {
	audio: {
		attributes: [
			'src',
			'preload',
			'autoplay',
			'mediagroup',
			'loop',
			'muted',
		],
	},
	canvas: { attributes: [ 'width', 'height' ] },
	embed: { attributes: [ 'src', 'type', 'width', 'height' ] },
	img: {
		attributes: [
			'alt',
			'src',
			'srcset',
			'usemap',
			'ismap',
			'width',
			'height',
		],
	},
	object: {
		attributes: [
			'data',
			'type',
			'name',
			'usemap',
			'form',
			'width',
			'height',
		],
	},
	video: {
		attributes: [
			'src',
			'poster',
			'preload',
			'playsinline',
			'autoplay',
			'mediagroup',
			'loop',
			'muted',
			'controls',
			'width',
			'height',
		],
	},
	math: {
		attributes: [ 'display', 'xmlns' ],
		children: '*',
	},
};

const excludedElements = [ '#text', 'br', 'wbr' ];

// Wire up children for each text-level wrapper.
// - Recursion is needed (e.g. strong > em > strong; not strong > strong).
// - <img> is allowed too: text-level wrappers accept phrasing content, and
//   <a>'s transparent model permits non-interactive embedded content.
Object.keys( textContentSchema )
	.filter( ( element ) => ! excludedElements.includes( element ) )
	.forEach( ( tag ) => {
		const { [ tag ]: removedTag, ...restSchema } = textContentSchema;
		textContentSchema[ tag ].children = {
			...restSchema,
			img: embeddedContentSchema.img,
		};
	} );

/**
 * Phrasing content elements.
 *
 * @see https://www.w3.org/TR/2011/WD-html5-20110525/content-models.html#phrasing-content-0
 */
const phrasingContentSchema = {
	...textContentSchema,
	...embeddedContentSchema,
};

/**
 * Get schema of possible paths for phrasing content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
 *
 * @param {string} [context] Set to "paste" to exclude invisible elements and
 *                           sensitive data.
 *
 * @return {Partial<ContentSchema>} Schema.
 */
export function getPhrasingContentSchema( context ) {
	if ( context !== 'paste' ) {
		return phrasingContentSchema;
	}

	/**
	 * @type {Partial<ContentSchema>}
	 */
	const {
		u, // Used to mark misspelling. Shouldn't be pasted.
		abbr, // Invisible.
		data, // Invisible.
		time, // Invisible.
		wbr, // Invisible.
		bdi, // Invisible.
		bdo, // Invisible.
		...remainingContentSchema
	} = {
		...phrasingContentSchema,
		// We shouldn't paste potentially sensitive information which is not
		// visible to the user when pasted, so strip the attributes.
		ins: { children: phrasingContentSchema.ins.children },
		del: { children: phrasingContentSchema.del.children },
	};

	return remainingContentSchema;
}

/**
 * Find out whether or not the given node is phrasing content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
 *
 * @param {Node} node The node to test.
 *
 * @return {boolean} True if phrasing content, false if not.
 */
export function isPhrasingContent( node ) {
	const tag = node.nodeName.toLowerCase();
	return getPhrasingContentSchema().hasOwnProperty( tag ) || tag === 'span';
}

/**
 * @param {Node} node
 * @return {boolean} Node is text content
 */
export function isTextContent( node ) {
	const tag = node.nodeName.toLowerCase();
	return textContentSchema.hasOwnProperty( tag ) || tag === 'span';
}
