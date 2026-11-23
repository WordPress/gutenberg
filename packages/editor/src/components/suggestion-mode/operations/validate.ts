/**
 * Validation of the attribute values a suggestion proposes, run when a
 * reviewer accepts.
 *
 * The values were written by the suggester and are saved by the reviewer,
 * who may hold capabilities the suggester lacks (`unfiltered_html`,
 * `edit_css`). The server filters markup out of them when the note is
 * written, but a value with no markup can still become markup once the
 * block serializes it: a tag name, a URL, a CSS string. So accept takes only
 * what the block type declares, in the shape it declares, and refuses the
 * values that turn into something else on save.
 */
import { getBlockType } from '@wordpress/blocks';
import type { SuggestionOperation } from './payload';
import { hasDisallowedProtocol } from './url-scheme';

/** Why an operation cannot be applied. */
export type OperationProblem =
	/** The block type is not registered. */
	| 'unknown-block-type'
	/** The block type does not declare the attribute. */
	| 'unknown-attribute'
	/** The value does not match the attribute's `type` or `enum`. */
	| 'invalid-value'
	/** The value would serialize as script, a disallowed URL or raw CSS. */
	| 'unsafe-value';

/**
 * Elements a block may be asked to render as when its tag name attribute
 * declares no `enum`: the sectioning and grouping elements, none of which
 * runs script, loads a resource or submits a form. An allowlist, since the
 * serializer writes any name it is given and the unsafe names cannot be
 * listed (custom elements, names added to HTML later).
 */
const SAFE_TAG_NAMES = new Set( [
	'div',
	'header',
	'main',
	'section',
	'article',
	'aside',
	'footer',
	'nav',
	'figure',
	'hgroup',
	'address',
	'blockquote',
	'p',
	'span',
	'ul',
	'ol',
	'li',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
] );

/** Attribute names that hold the element a block renders as. */
const TAG_NAME_ATTRIBUTE = /^tagName$|TagName$/;

/** Attribute and nested keys whose string value is a URL. */
const URL_KEY = /(url|href|src|link|poster)$/i;

/** HTML attributes a `source: 'attribute'` block attribute reads a URL from. */
const URL_HTML_ATTRIBUTES = new Set( [
	'href',
	'src',
	'poster',
	'action',
	'formaction',
	'data',
	'cite',
] );

/**
 * What lets a `style` value leave the declaration it is written into: a
 * second declaration, a rule, a comment, an escape, or a resource load.
 */
const CSS_BREAKOUT = /[;{}<>\\]|\/\*|url\s*\(|expression\s*\(|@import/i;

/**
 * What lets a URL in a `style` leave the quoted `url()` it is written into (a
 * quote, an escape, a control character), and what a filter that splits a
 * style into declarations and rules would cut it at.
 */
const CSS_URL_BREAKOUT = /[;{}<>\\'"\u0000-\u001f\u007f]/;

/** Metadata keys the system owns; never part of a proposal. */
const SYSTEM_METADATA_KEYS = [ 'noteId', 'suggestion' ];

function isPlainObject( value: unknown ): value is Record< string, unknown > {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
}

function isOfType( value: unknown, type: unknown ): boolean {
	if ( Array.isArray( type ) ) {
		return type.some( ( entry ) => isOfType( value, entry ) );
	}
	switch ( type ) {
		// A proposal holds rich text as its HTML string.
		case 'rich-text':
		case 'string':
			return typeof value === 'string';
		case 'boolean':
			return typeof value === 'boolean';
		case 'object':
			return isPlainObject( value );
		case 'array':
			return Array.isArray( value );
		case 'null':
			return value === null;
		case 'integer':
			return Number.isInteger( value );
		case 'number':
			return typeof value === 'number' && Number.isFinite( value );
	}
	return true;
}

function isJsonEqual( a: unknown, b: unknown ): boolean {
	return JSON.stringify( a ?? null ) === JSON.stringify( b ?? null );
}

/**
 * Whether any string under a URL-bearing key names a disallowed protocol.
 *
 * @param value Proposed value, or a part of it.
 * @param isUrl Whether a string found here is a URL.
 * @return True when one does.
 */
function hasUnsafeUrl( value: unknown, isUrl: boolean ): boolean {
	if ( typeof value === 'string' ) {
		return isUrl && hasDisallowedProtocol( value );
	}
	if ( Array.isArray( value ) ) {
		return value.some( ( entry ) => hasUnsafeUrl( entry, isUrl ) );
	}
	if ( isPlainObject( value ) ) {
		return Object.entries( value ).some( ( [ key, entry ] ) =>
			hasUnsafeUrl( entry, URL_KEY.test( key ) )
		);
	}
	return false;
}

/**
 * Whether a proposed `style` carries CSS the suggester may not be allowed to
 * write. Custom CSS (`css`, at any depth) needs `edit_css`, so a proposal may
 * not add or change it; every other string is one declaration's value, or a
 * URL inside one.
 *
 * @param value Proposed style, or a part of it.
 * @param live  The block's live value at the same path.
 * @param key   The key the value sits under.
 * @return True when it does.
 */
function hasUnsafeStyle( value: unknown, live: unknown, key = '' ): boolean {
	if ( typeof value === 'string' ) {
		if ( key === 'css' ) {
			return value !== live;
		}
		// A URL is also checked by scheme, as it is under any other attribute.
		return ( URL_KEY.test( key ) ? CSS_URL_BREAKOUT : CSS_BREAKOUT ).test(
			value
		);
	}
	if ( Array.isArray( value ) ) {
		return value.some( ( entry, index ) =>
			hasUnsafeStyle(
				entry,
				Array.isArray( live ) ? live[ index ] : undefined,
				key
			)
		);
	}
	if ( isPlainObject( value ) ) {
		return Object.entries( value ).some( ( [ childKey, entry ] ) =>
			hasUnsafeStyle(
				entry,
				isPlainObject( live ) ? live[ childKey ] : undefined,
				childKey
			)
		);
	}
	return false;
}

/**
 * The first reason a payload's `attribute-set` operations cannot be applied
 * to a block, or null when they all can. Nothing is dropped or repaired: one
 * invalid operation refuses the whole apply, so a reviewer never accepts a
 * change other than the one described.
 *
 * @param blockName      Name of the block the operations would change.
 * @param operations     Operations from the payload.
 * @param liveAttributes The block's current attributes.
 * @return The problem, or null.
 */
export function findAttributeOperationProblem(
	blockName: string | null | undefined,
	operations: SuggestionOperation[] | null | undefined,
	liveAttributes?: Record< string, any > | null
): OperationProblem | null {
	const attributeOps = ( operations ?? [] ).filter(
		( op ) => op?.type === 'attribute-set'
	);
	if ( attributeOps.length === 0 ) {
		return null;
	}
	/*
	 * A registered type's attributes include the ones block supports add
	 * (`className`, `style`, `anchor`, `lock`, `metadata`...), since those
	 * are added by a filter on registration.
	 */
	const declared: Record< string, any > | undefined = blockName
		? getBlockType( blockName )?.attributes
		: undefined;
	if ( ! declared ) {
		return 'unknown-block-type';
	}
	for ( const op of attributeOps ) {
		const name = op.attribute;
		if (
			typeof name !== 'string' ||
			! Object.prototype.hasOwnProperty.call( declared, name )
		) {
			return 'unknown-attribute';
		}
		const proposed = op.after;
		// An unset value puts the attribute back to its default.
		if ( proposed === null || proposed === undefined ) {
			continue;
		}
		const schema = declared[ name ] ?? {};
		if (
			schema.type !== undefined &&
			! isOfType( proposed, schema.type )
		) {
			return 'invalid-value';
		}
		if (
			Array.isArray( schema.enum ) &&
			! schema.enum.some( ( allowed: unknown ) =>
				isJsonEqual( allowed, proposed )
			)
		) {
			return 'invalid-value';
		}
		if (
			name === 'metadata' &&
			isPlainObject( proposed ) &&
			SYSTEM_METADATA_KEYS.some( ( key ) =>
				Object.prototype.hasOwnProperty.call( proposed, key )
			)
		) {
			return 'invalid-value';
		}
		/*
		 * A declared `enum` is the block's own list of elements. Without one
		 * the attribute is a free string the block's save writes as an
		 * element name; an empty one is the block's default element.
		 */
		if (
			TAG_NAME_ATTRIBUTE.test( name ) &&
			! Array.isArray( schema.enum ) &&
			proposed !== '' &&
			! ( typeof proposed === 'string' && SAFE_TAG_NAMES.has( proposed ) )
		) {
			return 'unsafe-value';
		}
		const isUrl =
			URL_KEY.test( name ) ||
			( schema.source === 'attribute' &&
				URL_HTML_ATTRIBUTES.has( schema.attribute ) );
		if ( hasUnsafeUrl( proposed, isUrl ) ) {
			return 'unsafe-value';
		}
		if (
			name === 'style' &&
			hasUnsafeStyle( proposed, liveAttributes?.style )
		) {
			return 'unsafe-value';
		}
	}
	return null;
}
