import removeAccents from 'remove-accents';
import { noCase } from 'change-case';

// Normalization regexes.
const splitRegexp = [
	/([\p{Ll}\p{Lo}\p{N}])([\p{Lu}\p{Lt}])/gu, // One lowercase or digit, followed by one uppercase.
	/([\p{Lu}\p{Lt}])([\p{Lu}\p{Lt}][\p{Ll}\p{Lo}])/gu, // One uppercase followed by one uppercase and one lowercase.
];
const stripRegexp = /(\p{C}|\p{P}|\p{S})+/giu; // Anything that's not a punctuation, symbol or control/format character.

/**
 * Tiers a single field value can match at, from best to worst. A match is
 * always placed in exactly one tier; the tier dominates every other signal.
 *
 * Deliberately absent is a fuzzy "characters appear in order" tier. It matches
 * far more than users expect from the inserter, and the term-level `MATCHES`
 * tier already covers multi-word queries.
 */
export const SEARCH_RANK = {
	NO_MATCH: 0,
	/** Every search term appears somewhere across the item's fields. */
	MATCHES: 1,
	/** The value contains the search phrase. */
	CONTAINS: 2,
	/** A word inside the value starts with the search phrase. */
	WORD_STARTS_WITH: 3,
	/** The value starts with the search phrase. */
	STARTS_WITH: 4,
	/** The value is the search phrase. */
	EQUAL: 5,
} as const;

type SearchRank = ( typeof SEARCH_RANK )[ keyof typeof SEARCH_RANK ];

/**
 * A field to rank an item by: how to read it, and how high a match in it is
 * allowed to rank.
 */
type SearchField< T > = {
	/** Reads the field off an item, as one value or several. */
	get: ( item: T ) => string | string[] | undefined | null;
	/** Cap on the tier a match in this field can reach. Defaults to `EQUAL`. */
	maxRank?: SearchRank;
};

type SearchOptions< T > = {
	/** Field descriptors, in priority order. */
	fields?: SearchField< T >[];
	/** Predicate applied before ranking. */
	filter?: ( item: T ) => boolean;
	/** Comparator applied last, when rank, field priority and closeness all tie. */
	tiebreak?: ( a: T, b: T ) => number;
};

/**
 * The shape most searchable items share, which `DEFAULT_FIELDS` reads.
 */
type DefaultSearchItem = {
	title?: string;
	name?: string;
	keywords?: string[];
	category?: string;
	description?: string;
};

const readDefaultField =
	( key: keyof DefaultSearchItem ) => ( item: unknown ) =>
		( item as DefaultSearchItem )[ key ];

/**
 * Field descriptors for the shape most searchable items share: a title, a
 * name or slug, keywords, a category and a description.
 *
 * The order is the priority order, and the caps are what keep a secondary
 * field from outranking the title.
 */
const DEFAULT_FIELDS: SearchField< unknown >[] = [
	{ get: readDefaultField( 'title' ) },
	{
		get: readDefaultField( 'name' ),
		maxRank: SEARCH_RANK.WORD_STARTS_WITH,
	},
	{
		get: readDefaultField( 'keywords' ),
		maxRank: SEARCH_RANK.WORD_STARTS_WITH,
	},
	{ get: readDefaultField( 'category' ), maxRank: SEARCH_RANK.CONTAINS },
	{ get: readDefaultField( 'description' ), maxRank: SEARCH_RANK.CONTAINS },
];

/** A field value, normalized and tokenized. */
type DerivedValue = {
	normalized: string;
	words: string[];
};

/** Everything the ranking needs from a search input. */
type Query = {
	terms: string[];
	phrase: string;
};

/** How well one value matched, and where in it. */
type Match = {
	rank: SearchRank;
	closeness: number;
};

/** A match against a whole item, and the field it came from. */
type ItemMatch = Match & {
	fieldIndex: number;
};

/*
 * Normalizing and tokenizing a field value is the hot path: it runs for every
 * value of every item on every keystroke, and a pattern library of a few
 * thousand items has tens of thousands of values.
 *
 * The derived values are cached on the item itself, so they are computed once
 * per item instead of once per keystroke, and are collected along with it. A
 * size-bounded string cache cannot do this job: items are scanned in order, so
 * whatever it evicts is precisely what the next item needs.
 */
const fieldValueCache = new WeakMap< object, Map< string, DerivedValue > >();

/**
 * Sanitizes the search input string.
 *
 * @param input The search input to normalize.
 *
 * @return The normalized search input.
 */
export function normalizeString( input = '' ): string {
	// Disregard diacritics ("média"), accommodate the leading slash that
	// autocomplete expects ("/media"), and lowercase ("MEDIA").
	return removeAccents( input ).replace( /^\//, '' ).toLowerCase();
}

/**
 * Extracts words from an already normalized string.
 *
 * @param input The normalized string.
 *
 * @return Words, extracted from the input string.
 */
function extractWords( input: string ): string[] {
	return noCase( input, { splitRegexp, stripRegexp } )
		.split( ' ' )
		.filter( Boolean );
}

/**
 * Converts the search term into a list of normalized terms.
 *
 * @param input The search term to normalize.
 *
 * @return The normalized list of search terms.
 */
export function getNormalizedSearchTerms( input = '' ): string[] {
	return extractWords( normalizeString( input ) );
}

/**
 * Derives everything the ranking needs from a search input, once per search
 * rather than once per item.
 *
 * @param searchInput The search input.
 *
 * @return The query, or null when the input holds no search terms.
 */
function parseQuery( searchInput: string ): Query | null {
	const terms = getNormalizedSearchTerms( searchInput );

	return terms.length > 0
		? { terms, phrase: normalizeString( searchInput ).trim() }
		: null;
}

/**
 * Orders matches that landed in the same tier: the earlier the match, the
 * higher the score. Always within `(0, 0.5]`, so it can never promote a match
 * into the tier above.
 *
 * Match length is deliberately not a factor. Normalizing a score by the length
 * of the value penalizes long titles, which ranks "Our Coffee" above "Coffee
 * Roasting Guide" for the query "coffee".
 *
 * @param index Position of the match within the value.
 *
 * @return Score between 0 and 0.5.
 */
function getCloseness( index: number ): number {
	return 1 / ( 2 + index );
}

function toValues( value: string | string[] | undefined | null ): string[] {
	if ( Array.isArray( value ) ) {
		return value;
	}
	return value === undefined || value === null ? [] : [ value ];
}

/**
 * Returns a field's values, normalized and tokenized.
 *
 * @param item  The item to read.
 * @param field The field descriptor.
 *
 * @return The derived values.
 */
function getFieldValues< T extends object >(
	item: T,
	field: SearchField< T >
): DerivedValue[] {
	let cache = fieldValueCache.get( item );
	if ( ! cache ) {
		cache = new Map();
		fieldValueCache.set( item, cache );
	}

	const derived = [];
	for ( const value of toValues( field.get( item ) ) ) {
		let entry = cache.get( value );

		if ( ! entry ) {
			const normalized = normalizeString( String( value ) );
			entry = { normalized, words: extractWords( normalized ) };
			cache.set( value, entry );
		}

		if ( entry.normalized ) {
			derived.push( entry );
		}
	}

	return derived;
}

/**
 * Ranks a single field value against the search phrase.
 *
 * @param value            The derived value.
 * @param value.normalized The normalized value.
 * @param value.words      The value's words.
 * @param phrase           The normalized search phrase.
 *
 * @return The match, or null.
 */
function getValueMatch(
	{ normalized, words }: DerivedValue,
	phrase: string
): Match | null {
	if ( normalized === phrase ) {
		return { rank: SEARCH_RANK.EQUAL, closeness: getCloseness( 0 ) };
	}

	if ( normalized.startsWith( phrase ) ) {
		return { rank: SEARCH_RANK.STARTS_WITH, closeness: getCloseness( 0 ) };
	}

	// Word boundaries come from tokenizing rather than from `\b`, which only
	// understands ASCII and would skip Cyrillic, Georgian or CJK titles.
	const wordIndex = words.findIndex( ( word ) => word.startsWith( phrase ) );
	if ( wordIndex !== -1 ) {
		return {
			rank: SEARCH_RANK.WORD_STARTS_WITH,
			closeness: getCloseness( wordIndex ),
		};
	}

	const index = normalized.indexOf( phrase );
	if ( index !== -1 ) {
		return {
			rank: SEARCH_RANK.CONTAINS,
			closeness: getCloseness( index ),
		};
	}

	return null;
}

/**
 * Ranks one field of an item, capped at the field's `maxRank`.
 *
 * @param field  The field descriptor.
 * @param values The field's derived values.
 * @param phrase The normalized search phrase.
 *
 * @return The best match, or null.
 */
function getFieldMatch< T >(
	field: SearchField< T >,
	values: DerivedValue[],
	phrase: string
): Match | null {
	let best = null;
	for ( const value of values ) {
		const match = getValueMatch( value, phrase );

		if (
			match &&
			( ! best ||
				match.rank > best.rank ||
				( match.rank === best.rank &&
					match.closeness > best.closeness ) )
		) {
			best = match;
		}
	}

	if ( ! best ) {
		return null;
	}

	// Capping is what keeps a hit in a secondary field from outranking a title
	// match: a block whose description happens to equal the query should not
	// beat the block actually named after it.
	const maxRank = field.maxRank ?? SEARCH_RANK.EQUAL;
	return best.rank > maxRank ? { ...best, rank: maxRank } : best;
}

/**
 * Checks whether every search term appears somewhere across the item's fields.
 * This is what lets a multi-word query match words spread over the title,
 * keywords and description.
 *
 * @param valuesByField The derived values of each field.
 * @param terms         The normalized search terms.
 *
 * @return Whether every term matched.
 */
function hasEveryTerm(
	valuesByField: DerivedValue[][],
	terms: string[]
): boolean {
	return terms.every( ( term ) =>
		valuesByField.some( ( values ) =>
			values.some( ( value ) =>
				value.words.some( ( word ) => word.includes( term ) )
			)
		)
	);
}

/**
 * Ranks an item against an already parsed query.
 *
 * Each field is ranked on its own and the best one wins, rather than ranking
 * one string built by concatenating every field. Concatenating makes a
 * description hit indistinguishable from a title hit.
 *
 * @param item         The item to rank.
 * @param query        The parsed query.
 * @param query.terms  The normalized search terms.
 * @param query.phrase The normalized search phrase.
 * @param fields       The field descriptors, in priority order.
 *
 * @return The match, or null.
 */
function matchItem< T extends object >(
	item: T,
	{ terms, phrase }: Query,
	fields: SearchField< T >[]
): ItemMatch | null {
	let best = null;

	// The derived values are gathered as the fields are ranked so that the
	// term fallback below can reuse them instead of walking the item again.
	const valuesByField = [];

	for ( let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++ ) {
		const field = fields[ fieldIndex ];
		const values = getFieldValues( item, field );
		valuesByField.push( values );

		const match = getFieldMatch( field, values, phrase );

		// Ties are left with the earlier field, which is how field priority
		// breaks a tie between equally good matches.
		if ( match && ( ! best || match.rank > best.rank ) ) {
			best = { ...match, fieldIndex };
		}
	}

	if ( best ) {
		return best;
	}

	if ( hasEveryTerm( valuesByField, terms ) ) {
		return {
			rank: SEARCH_RANK.MATCHES,
			closeness: 0,
			fieldIndex: fields.length,
		};
	}

	return null;
}

/**
 * Filters and ranks an item list against a search input.
 *
 * @param items            Item list.
 * @param searchInput      Search input.
 * @param options          Search options.
 * @param options.fields   Field descriptors, in priority order. Each is
 *                         `{ get, maxRank }`, where `get` returns a string or
 *                         an array of strings.
 * @param options.filter   Predicate applied before ranking.
 * @param options.tiebreak Comparator applied last, when rank, field priority
 *                         and closeness all tie.
 *
 * @return Filtered and ranked item list.
 */
export function searchItems< T extends object >(
	items: T[] = [],
	searchInput = '',
	{ fields = DEFAULT_FIELDS, filter, tiebreak }: SearchOptions< T > = {}
): T[] {
	const candidates = filter ? items.filter( filter ) : items;
	const query = parseQuery( searchInput );

	// Without search terms there is nothing to rank against, so the caller's
	// own ordering is preserved.
	if ( ! query ) {
		return candidates;
	}

	const matches = [];
	for ( const item of candidates ) {
		const match = matchItem( item, query, fields );
		if ( match ) {
			matches.push( { item, ...match } );
		}
	}

	matches.sort(
		( a, b ) =>
			b.rank - a.rank ||
			a.fieldIndex - b.fieldIndex ||
			b.closeness - a.closeness ||
			( tiebreak ? tiebreak( a.item, b.item ) : 0 )
	);

	return matches.map( ( { item } ) => item );
}
