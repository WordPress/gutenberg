/**
 * How one inline suggestion sits among the others in its value, derived from
 * the markers on every read (never stored): inside other authors' additions
 * (its parents), holding other authors' suggestions (its children), only
 * partly inside someone's addition, deleting text someone else also
 * proposed to delete, or formatting text someone else already proposed to
 * format. Used for the sidebar's context lines; resolution itself
 * never needs it (see `resolution.ts`).
 */
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_ID_ATTRIBUTE,
	compareSuggestionIds,
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
	/**
	 * Other authors' additions holding every character of this one,
	 * outermost (oldest) first.
	 */
	parents: RelatedSuggestion[];
	/** Other authors' suggestions wholly inside this addition. */
	children: RelatedSuggestion[];
	/** Other authors' additions holding only some of this one's characters. */
	partlyIn: RelatedSuggestion[];
	/** Other authors' deletions of some of the text this one deletes. */
	alsoDeleting: RelatedSuggestion[];
	/**
	 * Other authors' older formatting changes on some of the text this
	 * formatting change covers: it was made on top of them.
	 */
	builtOn: RelatedSuggestion[];
}

const NONE: SuggestionRelations = {
	parents: [],
	children: [],
	partlyIn: [],
	alsoDeleting: [],
	builtOn: [],
};

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
	const charsOfKind = ( markerId: string, kind: SuggestionMarkerKind ) => {
		const chars = new Set< number >();
		for ( let i = 0; i < record.text.length; i++ ) {
			const carries = suggestionMarkersIn( record.formats[ i ] ).some(
				( marker ) =>
					suggestionKindOf( marker ) === kind &&
					String( marker.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] ) ===
						markerId
			);
			if ( carries ) {
				chars.add( i );
			}
		}
		return chars;
	};
	const additionChars = ( markerId: string ) =>
		charsOfKind( markerId, 'add' );

	const relations: SuggestionRelations = {
		parents: [],
		children: [],
		partlyIn: [],
		alsoDeleting: [],
		builtOn: [],
	};
	const ownAddition = additionChars( target );
	const ownDeletion = charsOfKind( target, 'del' );
	const ownFormat = charsOfKind( target, 'format' );
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
		if (
			ownDeletion.size &&
			[ ...charsOfKind( otherId, 'del' ) ].some( ( index ) =>
				ownDeletion.has( index )
			)
		) {
			relations.alsoDeleting.push( other );
		}
		if (
			ownFormat.size &&
			compareSuggestionIds( otherId, target ) < 0 &&
			[ ...charsOfKind( otherId, 'format' ) ].some( ( index ) =>
				ownFormat.has( index )
			)
		) {
			relations.builtOn.push( other );
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
			relations.parents.push( other );
		} else {
			relations.partlyIn.push( other );
		}
	}
	relations.parents.sort( ( a, b ) => compareSuggestionIds( a.id, b.id ) );
	relations.builtOn.sort( ( a, b ) => compareSuggestionIds( a.id, b.id ) );
	return relations;
}
