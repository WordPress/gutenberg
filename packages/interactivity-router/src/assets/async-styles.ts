/**
 * Utilities to deal with the style sheets that optimization plugins load
 * asynchronously.
 *
 * Plugins like WP Rocket, Jetpack Boost, Autoptimize, LiteSpeed Cache or
 * Perfmatters defer style sheets with markup that mutates itself as soon as the
 * resource has been downloaded:
 *
 * ```html
 * <!-- Print trick. -->
 * <link rel="stylesheet" href="x.css" media="print" onload="this.onload=null;this.media='all'">
 * <!-- Media stored in a data attribute. -->
 * <link rel="stylesheet" href="x.css" media="not all" data-media="all" onload="this.media=this.dataset.media">
 * <!-- Preload that is turned into a style sheet. -->
 * <link rel="preload" as="style" href="x.css" onload="this.onload=null;this.rel='stylesheet'">
 * ```
 *
 * The router compares the elements that are already in the document, which have
 * already mutated, against the markup of a freshly fetched page, which has not.
 * The functions in this module resolve the state that each of those elements
 * ends up in, so both sides can be compared, and rewrite the elements that the
 * router adopts to that final state.
 *
 * Detection always requires the inline `onload` handler, never the media value
 * alone: a `media="print"` link without a handler is a legit print style sheet,
 * and a `media="not all"` link without a handler is usually toggled by a script,
 * e.g., a dark mode switcher. Both must keep their face value.
 */

/** Matches an assignment of `stylesheet` to `this.rel`. */
const REL_ASSIGNMENT = /this\s*\.\s*rel\s*=\s*(['"])\s*stylesheet\s*\1/;

/** Matches an assignment of a static value to `this.media`. */
const MEDIA_ASSIGNMENT = /this\s*\.\s*media\s*=\s*(['"])([^'"]*)\1/;

/** Matches an assignment of a data attribute to `this.media`. */
const MEDIA_DATASET_ASSIGNMENT =
	/this\s*\.\s*media\s*=\s*this\s*\.\s*dataset\s*\.\s*([\w$]+)/;

/** Matches an assignment of an attribute value to `this.media`. */
const MEDIA_ATTRIBUTE_ASSIGNMENT =
	/this\s*\.\s*media\s*=\s*this\s*\.\s*getAttribute\s*\(\s*(['"])([^'"]+)\1\s*\)/;

/** Matches any other mutation of the media, like removing the attribute. */
const MEDIA_MUTATION =
	/this\s*\.\s*media\s*=|this\s*\.\s*(?:set|remove)Attribute\s*\(\s*(['"])\s*media\s*\1/;

/**
 * Returns the passed attribute value in a comparable form.
 *
 * @param value Attribute value.
 * @return Trimmed and lowercased value, or an empty string when it is missing.
 */
const normalizeAttribute = ( value: string | null ): string =>
	value?.trim().toLowerCase() || '';

/**
 * Returns the passed media value in a comparable form.
 *
 * @param value Media value.
 * @return Trimmed and lowercased media, defaulting to `all`.
 */
const normalizeMediaValue = ( value: string | null ): string =>
	normalizeAttribute( value ) || 'all';

/**
 * Returns the attribute name that corresponds to the passed `dataset` property.
 *
 * @param name Property name of the `dataset` object, e.g., `originalMedia`.
 * @return Attribute name, e.g., `data-original-media`.
 */
const getDataAttributeName = ( name: string ): string =>
	`data-${ name.replace(
		/[A-Z]/g,
		( char ) => `-${ char.toLowerCase() }`
	) }`;

/**
 * Returns the inline `onload` handler of the passed element.
 *
 * @param element `<style>` or `<link>` element.
 * @return Source code of the handler, or an empty string when there is none.
 */
const getInlineLoadHandler = ( element: Element ): string =>
	element.getAttribute( 'onload' ) ?? '';

/**
 * Returns whether the passed element is a `<link rel=preload as=style>` that
 * turns itself into a style sheet once it has been loaded.
 *
 * @param element `<style>` or `<link>` element.
 * @return Whether the element becomes a style sheet on load.
 */
export const isPreloadFlipLink = ( element: Element ): boolean =>
	element.localName === 'link' &&
	normalizeAttribute( element.getAttribute( 'rel' ) ) === 'preload' &&
	normalizeAttribute( element.getAttribute( 'as' ) ) === 'style' &&
	REL_ASSIGNMENT.test( getInlineLoadHandler( element ) );

/**
 * Returns whether the passed element is a plain `<link rel=preload>` resource
 * hint, which is not a style sheet and must not be managed by the router.
 *
 * @param element `<style>` or `<link>` element.
 * @return Whether the element is a plain resource hint.
 */
export const isUnmanagedPreloadLink = ( element: Element ): boolean =>
	normalizeAttribute( element.getAttribute( 'rel' ) ) === 'preload' &&
	! isPreloadFlipLink( element );

/**
 * State that the passed style element ends up in once it has been loaded.
 */
interface AsyncStyleState {
	/** Whether the element mutates itself once it has been loaded. */
	isAsync: boolean;
	/** Whether the element turns itself into a style sheet on load. */
	flipsRel: boolean;
	/** Media the element applies to once it has been loaded. */
	media: string;
	/** Attribute the inline handler reads the media from, if any. */
	mediaAttribute: string | null;
}

/**
 * Resolves the state that the passed style element ends up in.
 *
 * The media is resolved, in order of precedence, from the router's own
 * `media=preload` sentinel, from the value the inline `onload` handler assigns,
 * from the attribute that handler reads, and from the `media` attribute at face
 * value when there is no handler mutating it.
 *
 * @param element `<style>` or `<link>` element.
 * @return Resolved state of the element.
 */
export const getAsyncStyleState = ( element: Element ): AsyncStyleState => {
	const flipsRel = isPreloadFlipLink( element );
	const handler = getInlineLoadHandler( element );
	const faceValue = normalizeMediaValue( element.getAttribute( 'media' ) );

	let media = faceValue;
	let mediaAttribute: string | null = null;
	let mutatesMedia = false;

	if ( faceValue === 'preload' ) {
		// The element carries the sentinel set by the router, so the media it
		// applies to is the one stashed by `prepareStylePromise`.
		media = normalizeMediaValue(
			element.getAttribute( 'data-original-media' )
		);
	} else if ( handler ) {
		const assignment = handler.match( MEDIA_ASSIGNMENT );
		const datasetAssignment = handler.match( MEDIA_DATASET_ASSIGNMENT );
		const attributeAssignment = handler.match( MEDIA_ATTRIBUTE_ASSIGNMENT );

		if ( assignment ) {
			mutatesMedia = true;
			media = normalizeMediaValue( assignment[ 2 ] );
		} else if ( datasetAssignment ) {
			mutatesMedia = true;
			mediaAttribute = getDataAttributeName( datasetAssignment[ 1 ] );
			media = normalizeMediaValue(
				element.getAttribute( mediaAttribute )
			);
		} else if ( attributeAssignment ) {
			mutatesMedia = true;
			mediaAttribute = attributeAssignment[ 2 ];
			media = normalizeMediaValue(
				element.getAttribute( mediaAttribute )
			);
		} else if ( MEDIA_MUTATION.test( handler ) ) {
			// The handler mutates the media in a way that cannot be parsed,
			// e.g., removing the attribute. Every known case ends up applying
			// the style sheet to all media.
			mutatesMedia = true;
			media = 'all';
		}
	}

	return {
		isAsync: mutatesMedia || flipsRel,
		flipsRel,
		media,
		mediaAttribute,
	};
};

/**
 * Returns the media that the passed style element applies to once it has been
 * loaded.
 *
 * @param element `<style>` or `<link>` element.
 * @return Resolved media.
 */
export const getTargetMedia = ( element: Element ): string =>
	getAsyncStyleState( element ).media;

/**
 * Rewrites the passed `<link>` element to the state it ends up in once it has
 * been loaded.
 *
 * This function must only be called with the elements that the router adopts
 * from a page it fetched, never with the elements of the current document,
 * which are managed by the scripts that inserted them.
 *
 * Apart from resolving the asynchronous patterns, the inline handlers are
 * removed, so the plugin code doesn't run again on the copy inserted by the
 * router and doesn't overwrite the `media=preload` sentinel of a page that has
 * only been prefetched.
 *
 * @param element `<style>` or `<link>` element that the router adopts.
 */
export const canonicalizeStyleElement = ( element: Element ): void => {
	if ( element.localName !== 'link' ) {
		return;
	}

	const { isAsync, flipsRel, media, mediaAttribute } =
		getAsyncStyleState( element );

	if ( isAsync ) {
		if ( flipsRel ) {
			element.setAttribute( 'rel', 'stylesheet' );
			element.removeAttribute( 'as' );
			element.removeAttribute( 'fetchpriority' );
		}
		element.setAttribute( 'media', media );
		if ( mediaAttribute ) {
			element.removeAttribute( mediaAttribute );
		}
	}

	element.removeAttribute( 'onload' );
	element.removeAttribute( 'onerror' );
};
