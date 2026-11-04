/**
 * How one inline suggestion sits among the others in its value, derived from
 * the markers on every read (never stored): inside someone's addition (its
 * parent), holding other authors' suggestions (its children), or only partly
 * inside someone's addition. Used for the sidebar's context lines; resolution
 * itself never needs it (see `resolution.ts`).
 */
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_ID_ATTRIBUTE,
	suggestionKindOf,
	suggestionMarkersIn,
} from './format';
import type { SuggestionMarkerKind } from './format';
import { toRichTextRecord } from './rich-text-record';

export interface RelatedSuggestion {
	id: string;
	kind: SuggestionMarkerKind;
	authorId: string | null;
}

export interface SuggestionRelations {
	/** Another author's addition holding every character of this one. */
	parent: RelatedSuggestion | null;
	/** Other authors' suggestions wholly inside this addition. */
	children: RelatedSuggestion[];
	/** Other authors' additions holding only some of this one's characters. */
	partlyIn: RelatedSuggestion[];
}

const NONE: SuggestionRelations = { parent: null, children: [], partlyIn: [] };

/**
 * The relations of one suggestion to the others in a value.
 *
 * @param value Block attribute value (RichTextData, string, or other).
 * @param id    Suggestion (note) id.
 * @return Relations.
 */
export function suggestionRelations(
	value: any,
	id: number | string
): SuggestionRelations {
	const record = toRichTextRecord( value );
	if ( ! record ) {
		return NONE;
	}
	const target = String( id );
	// Characters per id, and the markers each id is carried by.
	const charsOf = new Map< string, Set< number > >();
	const info = new Map< string, RelatedSuggestion >();
	for ( let i = 0; i < record.text.length; i++ ) {
		for ( const marker of suggestionMarkersIn( record.formats[ i ] ) ) {
			const markerId = String(
				marker.attributes?.[ SUGGESTION_ID_ATTRIBUTE ]
			);
			const kind = suggestionKindOf( marker )!;
			if ( ! charsOf.has( markerId ) ) {
				charsOf.set( markerId, new Set() );
			}
			charsOf.get( markerId )!.add( i );
			const author = marker.attributes?.[ SUGGESTION_AUTHOR_ATTRIBUTE ];
			const existing = info.get( markerId );
			// A replacement carries one id on an add and a del run; its
			// add half is what can hold other suggestions.
			if ( ! existing || kind === 'add' ) {
				info.set( markerId, {
					id: markerId,
					kind,
					authorId:
						author === undefined || author === ''
							? null
							: String( author ),
				} );
			}
		}
	}
	const own = charsOf.get( target );
	const self = info.get( target );
	if ( ! own || ! self ) {
		return NONE;
	}
	const isOtherAuthor = ( other: RelatedSuggestion ) =>
		other.authorId !== self.authorId;
	const additionChars = ( markerId: string ) => {
		const chars = new Set< number >();
		for ( let i = 0; i < record.text.length; i++ ) {
			const isAddition = suggestionMarkersIn( record.formats[ i ] ).some(
				( marker ) =>
					suggestionKindOf( marker ) === 'add' &&
					String( marker.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] ) ===
						markerId
			);
			if ( isAddition ) {
				chars.add( i );
			}
		}
		return chars;
	};

	const relations: SuggestionRelations = {
		parent: null,
		children: [],
		partlyIn: [],
	};
	const ownAddition = additionChars( target );
	for ( const [ otherId, chars ] of charsOf ) {
		const other = info.get( otherId )!;
		if ( otherId === target || ! isOtherAuthor( other ) ) {
			continue;
		}
		// Others' suggestions wholly inside this addition.
		if (
			ownAddition.size &&
			[ ...chars ].every( ( index ) => ownAddition.has( index ) )
		) {
			relations.children.push( other );
			continue;
		}
		if ( other.kind !== 'add' ) {
			continue;
		}
		const outer = additionChars( otherId );
		const inside = [ ...own ].filter( ( index ) => outer.has( index ) );
		if ( ! inside.length ) {
			continue;
		}
		if ( inside.length === own.size ) {
			relations.parent ??= other;
		} else {
			relations.partlyIn.push( other );
		}
	}
	return relations;
}
