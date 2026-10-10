/**
 * The Suggestion mode guard on post-level edits.
 *
 * Suggesting proposes changes, it never applies them. Block content is
 * captured as markers inside the blocks, so `blocks`/`content`/`selection`
 * edits (and meta derived from them) pass through. Every other key of the
 * current post's record is either held as a proposal, which a reviewer
 * accepts or rejects later, or refused. Nothing reaches the saved post
 * without a reviewer. See issue #73411.
 *
 * Three seams enforce it, from the most to the least specific:
 *
 *   - `editPost` classifies its edits here and holds proposable fields as
 *     proposals instead of writing them.
 *   - `installSuggestPostEditGuard` (`suggest-post-edit-guard.ts`) wraps the core-data `editEntityRecord`
 *     action, so code that writes the entity directly (`useEntityProp`, a
 *     plugin, the console) is refused too, not only the editor's own panels.
 *   - `stripSuggestedPostSave` drops every post-level edit from a save made
 *     while suggesting: an edit staged in Editing, or one written before the
 *     guard was in place, can never be persisted from Suggesting.
 *
 * The pure sorting lives here; the side effects (the refusal notice, the
 * action wrap) live in `suggest-post-edit-guard.ts`. Both live with the
 * store rather than with the Suggestion mode components because `editPost`
 * and `savePost` call them, and the store must not import from the
 * component tree.
 */
import {
	SUGGEST_CONTENT_META_KEYS,
	SUGGEST_CONTENT_POST_FIELDS,
} from './constants';

/** A post-level change to hold as a proposal rather than apply. */
export interface ProposedPostEdit {
	/** The post field, e.g. `excerpt` or `meta`. */
	attribute: string;
	/** The meta key, for a `meta` proposal. */
	key?: string;
	/** The proposed value. */
	value: unknown;
}

/** How a set of post edits made while suggesting is handled. */
export interface SuggestedPostEditsVerdict {
	/** Edits that may reach the post: content, and unchanged keys dropped. */
	passthrough: Record< string, any >;
	/** Changes to hold as proposals. */
	proposals: ProposedPostEdit[];
	/** Fields that changed but cannot be suggested. */
	refused: string[];
}

export interface ClassifyOptions {
	/** The value the user currently sees for a post field. */
	getCurrentValue: ( attribute: string ) => any;
	/**
	 * Whether a changed field (or meta key) can be held as a proposal.
	 * Omitted, nothing is proposable and every change is refused.
	 */
	isProposable?: ( attribute: string, metaKey?: string ) => boolean;
}

/**
 * Structural equality for post field values (strings, numbers, term id
 * arrays, meta objects).
 *
 * @param a First value.
 * @param b Second value.
 * @return Whether the two values are equal.
 */
export function isPostValueEqual( a: any, b: any ): boolean {
	if ( a === b ) {
		return true;
	}
	if (
		a === null ||
		b === null ||
		typeof a !== 'object' ||
		typeof b !== 'object'
	) {
		return false;
	}
	if ( Array.isArray( a ) !== Array.isArray( b ) ) {
		return false;
	}
	const aKeys = Object.keys( a );
	const bKeys = Object.keys( b );
	if ( aKeys.length !== bKeys.length ) {
		return false;
	}
	return aKeys.every(
		( key ) =>
			Object.prototype.hasOwnProperty.call( b, key ) &&
			isPostValueEqual( a[ key ], b[ key ] )
	);
}

/**
 * Sort the edits made to the current post while suggesting into what may
 * reach the post, what to propose and what to refuse. Pure.
 *
 * A key repeated at the value it already holds changes nothing: it is
 * dropped silently rather than refused (controls such as `PostVisibility`
 * resend the current status with every choice).
 *
 * @param edits                   The edits.
 * @param options                 Options.
 * @param options.getCurrentValue The value the user currently sees for a
 *                                post field.
 * @param options.isProposable    Whether a changed field (or meta key) can
 *                                be held as a proposal.
 * @return The verdict.
 */
export function classifySuggestedPostEdits(
	edits: Record< string, any > | null | undefined,
	{ getCurrentValue, isProposable = () => false }: ClassifyOptions
): SuggestedPostEditsVerdict {
	const verdict: SuggestedPostEditsVerdict = {
		passthrough: {},
		proposals: [],
		refused: [],
	};
	for ( const [ attribute, value ] of Object.entries( edits ?? {} ) ) {
		if (
			( SUGGEST_CONTENT_POST_FIELDS as readonly string[] ).includes(
				attribute
			)
		) {
			verdict.passthrough[ attribute ] = value;
			continue;
		}
		if (
			attribute === 'meta' &&
			value &&
			typeof value === 'object' &&
			! Array.isArray( value )
		) {
			const currentMeta = getCurrentValue( 'meta' ) ?? {};
			const contentMeta: Record< string, any > = {};
			for ( const [ key, metaValue ] of Object.entries( value ) ) {
				if (
					( SUGGEST_CONTENT_META_KEYS as readonly string[] ).includes(
						key
					)
				) {
					contentMeta[ key ] = metaValue;
				} else if (
					isPostValueEqual( metaValue, currentMeta[ key ] )
				) {
					continue;
				} else if ( isProposable( 'meta', key ) ) {
					verdict.proposals.push( {
						attribute: 'meta',
						key,
						value: metaValue,
					} );
				} else {
					verdict.refused.push( `meta.${ key }` );
				}
			}
			if ( Object.keys( contentMeta ).length ) {
				verdict.passthrough.meta = contentMeta;
			}
			continue;
		}
		if ( isPostValueEqual( value, getCurrentValue( attribute ) ) ) {
			continue;
		}
		if ( isProposable( attribute ) ) {
			verdict.proposals.push( { attribute, value } );
		} else {
			verdict.refused.push( attribute );
		}
	}
	return verdict;
}

/**
 * Keep only the edits a save made while suggesting may send: the content,
 * and meta derived from it. Pure.
 *
 * @param edits The edits `savePost` is about to send.
 * @return The edits to send.
 */
export function stripSuggestedPostSave(
	edits: Record< string, any >
): Record< string, any > {
	const kept: Record< string, any > = {};
	for ( const [ key, value ] of Object.entries( edits ?? {} ) ) {
		if (
			key === 'id' ||
			( SUGGEST_CONTENT_POST_FIELDS as readonly string[] ).includes( key )
		) {
			kept[ key ] = value;
		} else if ( key === 'meta' && value && typeof value === 'object' ) {
			const meta = Object.fromEntries(
				Object.entries( value ).filter( ( [ metaKey ] ) =>
					( SUGGEST_CONTENT_META_KEYS as readonly string[] ).includes(
						metaKey
					)
				)
			);
			if ( Object.keys( meta ).length ) {
				kept.meta = meta;
			}
		}
	}
	return kept;
}
