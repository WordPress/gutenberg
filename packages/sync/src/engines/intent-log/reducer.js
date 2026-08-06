/**
 * The deterministic reducer: applies one intent to a document.
 *
 * Pure at the interface: returns a new document, never mutates the input.
 * Given the same log, every replica computes the same document — this is the
 * convergence mechanism (total order + determinism), and the function the
 * PHP twin must mirror exactly.
 *
 * The reducer is deliberately forgiving: the server only appends intents
 * that passed rebase, but the reducer still voids (never throws) on missing
 * targets and clamps out-of-range offsets, so a replayed log can never crash
 * a replica. Every application returns a disposition.
 */

import {
	cloneDocument,
	ensureField,
	ensureProps,
	getBlock,
	locateBlock,
	makeBlock,
	subtreeContains,
} from './document.js';
import { IntentTypes } from './intents.js';

const applied = ( doc ) => ( { doc, disposition: { status: 'applied' } } );
const voided = ( doc, reason ) => ( {
	doc,
	disposition: { status: 'voided', reason },
} );

function insertIntoSiblings( siblings, block, afterSiblingId ) {
	if ( afterSiblingId === null ) {
		siblings.unshift( block );
		return;
	}
	const index = siblings.findIndex( ( b ) => b.syncId === afterSiblingId );
	if ( index === -1 ) {
		siblings.push( block );
	} else {
		siblings.splice( index + 1, 0, block );
	}
}

function shiftFormatsForInsert( formats, offset, length ) {
	for ( const span of formats ) {
		if ( offset <= span.start ) {
			span.start += length;
			span.end += length;
		} else if ( offset < span.end ) {
			span.end += length;
		}
	}
}

function shiftFormatsForDelete( formats, start, end ) {
	const removed = end - start;
	const adjust = ( position ) => {
		if ( position <= start ) {
			return position;
		}
		if ( position >= end ) {
			return position - removed;
		}
		return start;
	};
	for ( const span of formats ) {
		span.start = adjust( span.start );
		span.end = adjust( span.end );
	}
	return formats.filter( ( span ) => span.end > span.start );
}

function applyTextDelete( field, start, end ) {
	field.text = field.text.slice( 0, start ) + field.text.slice( end );
	field.formats = shiftFormatsForDelete( field.formats, start, end );
}

function applyTextInsert( field, offset, text ) {
	field.text =
		field.text.slice( 0, offset ) + text + field.text.slice( offset );
	shiftFormatsForInsert( field.formats, offset, text.length );
}

/**
 * Applies one intent to a document.
 *
 * @param {Object} doc    Document (not mutated).
 * @param {Object} intent Intent.
 * @return {Object} { doc, disposition: { status: 'applied'|'voided', reason? } }.
 */
export function applyIntent( doc, intent ) {
	const next = cloneDocument( doc );
	const { payload } = intent;

	switch ( intent.type ) {
		case IntentTypes.SET_ATTR: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			block.attrs[ payload.key ] = payload.value;
			block.attrVersions[ payload.key ] =
				( block.attrVersions[ payload.key ] ?? 0 ) + 1;
			return applied( next );
		}

		case IntentTypes.REMOVE_ATTR: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			delete block.attrs[ payload.key ];
			block.attrVersions[ payload.key ] =
				( block.attrVersions[ payload.key ] ?? 0 ) + 1;
			return applied( next );
		}

		case IntentTypes.SET_PROPERTY: {
			const { props, propVersions } = ensureProps( next );
			props[ payload.name ] = payload.value;
			propVersions[ payload.name ] =
				( propVersions[ payload.name ] ?? 0 ) + 1;
			return applied( next );
		}

		case IntentTypes.INSERT_BLOCK: {
			// EVERY id the payload subtree brings in must be new, and unique
			// within the payload itself: a nested duplicate would silently
			// retarget all later intents addressing that id.
			const incomingIds = [];
			( function collectIds( blockPayload ) {
				incomingIds.push( blockPayload.syncId );
				for ( const child of blockPayload.children ?? [] ) {
					collectIds( child );
				}
			} )( payload.block );
			const seenIds = new Set();
			for ( const id of incomingIds ) {
				if ( getBlock( next, id ) || seenIds.has( id ) ) {
					return voided( next, 'duplicate-id' );
				}
				seenIds.add( id );
			}
			let siblings = next.root;
			if ( payload.parentId !== null ) {
				const parent = getBlock( next, payload.parentId );
				if ( ! parent ) {
					return voided( next, 'missing-parent' );
				}
				siblings = parent.children;
			}
			insertIntoSiblings(
				siblings,
				makeBlock( payload.block ),
				payload.afterSiblingId
			);
			return applied( next );
		}

		case IntentTypes.REMOVE_BLOCK: {
			const location = locateBlock( next, payload.syncId );
			if ( ! location ) {
				return voided( next, 'already-removed' );
			}
			location.siblings.splice( location.index, 1 );
			return applied( next );
		}

		case IntentTypes.MOVE_BLOCK: {
			const location = locateBlock( next, payload.syncId );
			if ( ! location ) {
				return voided( next, 'missing-target' );
			}
			let siblings = next.root;
			if ( payload.newParentId !== null ) {
				if ( subtreeContains( location.block, payload.newParentId ) ) {
					return voided( next, 'cycle' );
				}
				const parent = getBlock( next, payload.newParentId );
				if ( ! parent ) {
					return voided( next, 'missing-parent' );
				}
				siblings = parent.children;
			}
			const [ block ] = location.siblings.splice( location.index, 1 );
			insertIntoSiblings( siblings, block, payload.afterSiblingId );
			return applied( next );
		}

		case IntentTypes.SPLIT_BLOCK: {
			const location = locateBlock( next, payload.syncId );
			if ( ! location ) {
				return voided( next, 'missing-target' );
			}
			if ( getBlock( next, payload.newSyncId ) ) {
				return voided( next, 'duplicate-id' );
			}
			const { block } = location;
			const field = ensureField( block, payload.field );
			const offset = Math.min( payload.offset, field.text.length );
			// The tail receives only the split field; the block's other
			// fields stay whole on the head (matches editor split: the
			// edited rich-text attribute divides, siblings like a citation
			// stay put).
			const tail = makeBlock( {
				syncId: payload.newSyncId,
				blockType: block.blockType,
				attrs: block.attrs,
				fields: {
					[ payload.field ]: { text: field.text.slice( offset ) },
				},
				syncParent: block.syncId,
			} );
			const tailField = tail.fields[ payload.field ];
			for ( const span of field.formats ) {
				if ( span.end > offset ) {
					tailField.formats.push( {
						start: Math.max( 0, span.start - offset ),
						end: span.end - offset,
						format: span.format,
					} );
				}
			}
			field.text = field.text.slice( 0, offset );
			field.formats = field.formats
				.map( ( span ) => ( {
					...span,
					end: Math.min( span.end, offset ),
				} ) )
				.filter( ( span ) => span.end > span.start );
			location.siblings.splice( location.index + 1, 0, tail );
			return applied( next );
		}

		case IntentTypes.MERGE_BLOCKS: {
			const survivor = getBlock( next, payload.survivorId );
			const absorbedLocation = locateBlock( next, payload.absorbedId );
			if ( ! survivor || ! absorbedLocation ) {
				return voided( next, 'missing-target' );
			}
			if ( payload.survivorId === payload.absorbedId ) {
				return voided( next, 'self-merge' );
			}
			if (
				subtreeContains( absorbedLocation.block, payload.survivorId )
			) {
				return voided( next, 'cycle' );
			}
			const absorbed = absorbedLocation.block;
			// Only the named field is joined; the absorbed block's OTHER
			// fields are dropped (matches editor merge semantics — merging
			// into a paragraph discards a citation). A concurrent edit to a
			// dropped field escalates during rebase, so the drop cannot
			// silently swallow another actor's work.
			const survivorField = ensureField( survivor, payload.field );
			const absorbedField = absorbed.fields[ payload.field ] ?? {
				text: '',
				formats: [],
			};
			const joinOffset = survivorField.text.length;
			survivorField.text += absorbedField.text;
			for ( const span of absorbedField.formats ) {
				survivorField.formats.push( {
					start: span.start + joinOffset,
					end: span.end + joinOffset,
					format: span.format,
				} );
			}
			survivor.children.push( ...absorbed.children );
			absorbedLocation.siblings.splice( absorbedLocation.index, 1 );
			return applied( next );
		}

		case IntentTypes.TRANSFORM_BLOCK: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			block.blockType = payload.newBlockType;
			return applied( next );
		}

		case IntentTypes.INSERT_TEXT: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			const field = ensureField( block, payload.field );
			const offset = Math.min( payload.offset, field.text.length );
			applyTextInsert( field, offset, payload.text );
			return applied( next );
		}

		case IntentTypes.DELETE_TEXT: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			const field = ensureField( block, payload.field );
			const start = Math.min( payload.start, field.text.length );
			const end = Math.min( payload.end, field.text.length );
			if ( end <= start ) {
				return voided( next, 'empty-after-clamp' );
			}
			applyTextDelete( field, start, end );
			return applied( next );
		}

		case IntentTypes.FORMAT_TEXT: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			const field = ensureField( block, payload.field );
			const start = Math.min( payload.start, field.text.length );
			const end = Math.min( payload.end, field.text.length );
			if ( end <= start ) {
				return voided( next, 'empty-after-clamp' );
			}
			if ( payload.on ) {
				field.formats.push( { start, end, format: payload.format } );
				return applied( next );
			}
			const nextFormats = [];
			for ( const span of field.formats ) {
				if (
					span.format !== payload.format ||
					span.end <= start ||
					span.start >= end
				) {
					nextFormats.push( span );
					continue;
				}
				if ( span.start < start ) {
					nextFormats.push( { ...span, end: start } );
				}
				if ( span.end > end ) {
					nextFormats.push( { ...span, start: end } );
				}
			}
			field.formats = nextFormats;
			return applied( next );
		}

		case IntentTypes.REPLACE_TEXT: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			const field = ensureField( block, payload.field );
			const start = Math.min( payload.start, field.text.length );
			const end = Math.min( payload.end, field.text.length );
			if ( end > start ) {
				applyTextDelete( field, start, end );
			}
			applyTextInsert( field, start, payload.text );
			return applied( next );
		}

		case IntentTypes.REPLACE_ATTR_CONTENT: {
			const block = getBlock( next, payload.syncId );
			if ( ! block ) {
				return voided( next, 'missing-target' );
			}
			const field = ensureField( block, payload.field );
			field.text = payload.newText;
			field.formats = [];
			return applied( next );
		}

		default:
			return voided( next, 'unknown-type' );
	}
}

/**
 * Replays a log of intents from an initial document.
 *
 * @param {Object}   initialDoc Genesis document.
 * @param {Object[]} log        Ordered accepted intents.
 * @return {Object} Final document.
 */
export function replay( initialDoc, log ) {
	let doc = initialDoc;
	for ( const intent of log ) {
		( { doc } = applyIntent( doc, intent ) );
	}
	return doc;
}
