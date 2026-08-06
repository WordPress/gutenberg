/**
 * Minimal block document model. See SPEC.md ("Known simplifications").
 *
 * A document is a tree of blocks. Each block carries: syncId, blockType,
 * per-key attrs with per-key versions (the sync-map registers), named
 * rich-text fields (each text + format spans — real blocks have several
 * rich-text attributes, e.g. quote value + citation), and children.
 *
 * The model favors clarity over performance: lookups walk the tree, and the
 * reducer clones the document before mutating. Documents in the simulator
 * are small; the production representation is a separate concern.
 */

/**
 * The field name used when a block spec or intent does not name one. Mirrors
 * the common case of a single rich-text attribute (`content`).
 */
export const DEFAULT_FIELD = 'content';

function makeField( spec = {} ) {
	return {
		text: spec.text ?? '',
		formats: ( spec.formats ?? [] ).map( ( span ) => ( { ...span } ) ),
	};
}

/**
 * Creates a block node.
 *
 * @param {Object} spec Block spec: syncId, blockType, and optionally attrs,
 *                      fields (name → { text, formats }), text/formats
 *                      (shorthand for the default `content` field),
 *                      children, syncParent.
 * @return {Object} Block node.
 */
export function makeBlock( spec ) {
	const fields = {};
	for ( const [ name, field ] of Object.entries( spec.fields ?? {} ) ) {
		fields[ name ] = makeField( field );
	}
	if ( ! ( DEFAULT_FIELD in fields ) ) {
		fields[ DEFAULT_FIELD ] = makeField( {
			text: spec.text,
			formats: spec.formats,
		} );
	}
	return {
		syncId: spec.syncId,
		blockType: spec.blockType,
		attrs: { ...( spec.attrs ?? {} ) },
		attrVersions: { ...( spec.attrVersions ?? {} ) },
		fields,
		syncParent: spec.syncParent ?? null,
		children: ( spec.children ?? [] ).map( makeBlock ),
	};
}

/**
 * Returns a block's named field, creating an empty one on first write-style
 * access. The reducer is forgiving: writing to a field the block does not
 * have yet creates it rather than crashing a replay.
 *
 * @param {Object} block Block node (mutated if the field is missing).
 * @param {string} name  Field name.
 * @return {Object} { text, formats }.
 */
export function ensureField( block, name ) {
	if ( ! block.fields[ name ] ) {
		block.fields[ name ] = makeField();
	}
	return block.fields[ name ];
}

/**
 * Creates a document from root block specs and optional entity properties.
 *
 * @param {Object[]} blocks Root block specs.
 * @param {Object}   props  Entity properties (name → value).
 * @return {Object} Document.
 */
export function createDocument( blocks = [], props = {} ) {
	const doc = { root: blocks.map( makeBlock ) };
	if ( Object.keys( props ).length ) {
		doc.props = { ...props };
		doc.propVersions = {};
	}
	return doc;
}

/**
 * Ensures a document has entity property maps, creating them on first
 * write-style access — documents predating the entity family (or created
 * without properties) lack them.
 *
 * @param {Object} doc Document (mutated if the maps are missing).
 * @return {Object} The document's { props, propVersions }.
 */
export function ensureProps( doc ) {
	if ( ! doc.props ) {
		doc.props = {};
	}
	if ( ! doc.propVersions ) {
		doc.propVersions = {};
	}
	return { props: doc.props, propVersions: doc.propVersions };
}

/**
 * Deep-clones a document.
 *
 * @param {Object} doc Document.
 * @return {Object} Clone.
 */
export function cloneDocument( doc ) {
	return structuredClone( doc );
}

function walk( siblings, parentId, visitor ) {
	for ( let index = 0; index < siblings.length; index++ ) {
		const block = siblings[ index ];
		const result =
			visitor( block, siblings, index, parentId ) ??
			walk( block.children, block.syncId, visitor );
		if ( result !== undefined ) {
			return result;
		}
	}
	return undefined;
}

/**
 * Finds a block and its location.
 *
 * @param {Object} doc    Document.
 * @param {string} syncId Target block id.
 * @return {Object|null} { block, siblings, index, parentId } or null.
 */
export function locateBlock( doc, syncId ) {
	return (
		walk( doc.root, null, ( block, siblings, index, parentId ) =>
			block.syncId === syncId
				? { block, siblings, index, parentId }
				: undefined
		) ?? null
	);
}

/**
 * Returns the block node for a syncId, or null.
 *
 * @param {Object} doc    Document.
 * @param {string} syncId Target block id.
 * @return {Object|null} Block node.
 */
export function getBlock( doc, syncId ) {
	return locateBlock( doc, syncId )?.block ?? null;
}

/**
 * Whether the subtree rooted at `rootBlock` contains `syncId` (including the
 * root itself). Used for move cycle checks.
 *
 * @param {Object} rootBlock Subtree root.
 * @param {string} syncId    Candidate descendant id.
 * @return {boolean} Whether contained.
 */
export function subtreeContains( rootBlock, syncId ) {
	if ( rootBlock.syncId === syncId ) {
		return true;
	}
	return rootBlock.children.some( ( child ) =>
		subtreeContains( child, syncId )
	);
}

/**
 * All syncIds in the document, in depth-first order.
 *
 * @param {Object} doc Document.
 * @return {string[]} Ids.
 */
export function allSyncIds( doc ) {
	const ids = [];
	walk( doc.root, null, ( block ) => {
		ids.push( block.syncId );
		return undefined;
	} );
	return ids;
}

function canonicalBlock( block ) {
	const sortEntries = ( obj, mapValue = ( value ) => value ) =>
		Object.fromEntries(
			Object.entries( obj )
				.sort( ( [ a ], [ b ] ) => ( a < b ? -1 : 1 ) )
				.map( ( [ key, value ] ) => [ key, mapValue( value ) ] )
		);
	const canonicalField = ( field ) => ( {
		text: field.text,
		formats: [ ...field.formats ].sort(
			( a, b ) =>
				a.start - b.start ||
				a.end - b.end ||
				( a.format < b.format ? -1 : 1 )
		),
	} );
	return {
		syncId: block.syncId,
		blockType: block.blockType,
		attrs: sortEntries( block.attrs ),
		attrVersions: sortEntries( block.attrVersions ),
		fields: sortEntries( block.fields, canonicalField ),
		syncParent: block.syncParent,
		children: block.children.map( canonicalBlock ),
	};
}

/**
 * Canonical JSON of a document — key- and span-order independent, so
 * incrementally maintained documents can be compared with fresh replays.
 *
 * Entity property maps are emitted ONLY when non-empty, so documents
 * predating the entity family canonicalize byte-identically to their
 * original form (the frozen cross-language vectors depend on this).
 *
 * @param {Object} doc Document.
 * @return {string} Canonical JSON.
 */
export function canonicalJson( doc ) {
	const sortEntries = ( obj ) =>
		Object.fromEntries(
			Object.entries( obj ).sort( ( [ a ], [ b ] ) => ( a < b ? -1 : 1 ) )
		);
	const canonical = { root: doc.root.map( canonicalBlock ) };
	if ( doc.props && Object.keys( doc.props ).length ) {
		canonical.props = sortEntries( doc.props );
	}
	if ( doc.propVersions && Object.keys( doc.propVersions ).length ) {
		canonical.propVersions = sortEntries( doc.propVersions );
	}
	return JSON.stringify( canonical );
}

/**
 * Structural equality via canonical JSON.
 *
 * @param {Object} a First document.
 * @param {Object} b Second document.
 * @return {boolean} Whether structurally equal.
 */
export function documentsEqual( a, b ) {
	return canonicalJson( a ) === canonicalJson( b );
}
