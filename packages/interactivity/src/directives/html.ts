import { useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { afterNextFrame, isPlainObject, useLayoutEffect, warn } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';
import { getHtmlFallback, getHtmlServerContent } from '../vdom';
import { emptyHTML, isDangerousHTML, getDangerousHTML } from '../html';

/**
 * Checks whether a value is `{ wpServerHtml: true }`, the server's
 * representation of a trusted HTML token in the page's data.
 *
 * @param value Value to check.
 *
 * @return Whether the value is the server token representation.
 */
const isServerHTMLRepresentation = ( value: unknown ): boolean =>
	isPlainObject( value ) && value.wpServerHtml === true;

/**
 * Lists the HTML-namespace `<template>` elements of a fragment, in tree order,
 * without those inside template contents.
 *
 * @param content The fragment to search.
 *
 * @return The template elements.
 */
const getTemplates = ( content: DocumentFragment ) =>
	Array.from( content.querySelectorAll( 'template' ) ).filter(
		( template ) => template.namespaceURI === 'http://www.w3.org/1999/xhtml'
	);

/**
 * Checks whether two server content snapshots hold the same nodes: the same
 * names, attributes and data, in the same order, at every depth. Unlike
 * `isEqualNode()` alone, the contents of `<template>` elements are compared
 * too.
 *
 * @param content A detached snapshot.
 * @param other   Another detached snapshot.
 *
 * @return Whether the snapshots hold the same nodes.
 */
const isSameServerContent = (
	content: DocumentFragment,
	other: DocumentFragment
): boolean => {
	if ( ! content.isEqualNode( other ) ) {
		return false;
	}
	// Equal trees hold their templates at the same places.
	const otherTemplates = getTemplates( other );
	return getTemplates( content ).every( ( template, index ) =>
		isSameServerContent( template.content, otherTemplates[ index ].content )
	);
};

/**
 * What the directive last did with its host element's content: the HTML it
 * wrote, or adopted from matching content, or the kind and markup of the
 * value the browser rejected.
 */
type WriteRecord =
	| {
			/**
			 * The written or adopted value as a string, which the element may
			 * serialize differently.
			 */
			applied: string;
	  }
	| {
			/** The rejected value as a string. */
			rejected: string;
			/** Whether the rejected value is a plain string, not `TrustedHTML`. */
			plainString: boolean;
	  };

// data-wp-html — Inner HTML binding for explicitly trusted content.
directive(
	'html',
	( { directives: { html: htmlEntries }, element, evaluate } ) => {
		// Default entry; unsupported variants retain their original props.
		const entry = htmlEntries.find( isDefaultDirectiveSuffix );
		// What the directive last did with the host's content. It's undefined
		// for a new host and after the server representation, so the next
		// token is compared with the element's content and adopted when it
		// matches. Non-token values write empty HTML, so returning tokens are
		// written again after a removal.
		const writeRecord = useRef< WriteRecord | undefined >( undefined );
		// The value-rule state belongs to a host element, not its wrapper vnode.
		const previousHost = useRef< HTMLElement | null >( null );
		// Inputs are compared inside the effect so host replacements can be
		// detected on every commit without repeating unchanged value-rule work.
		const previousInputs = useRef< unknown[] | null >( null );
		// Server content snapshot of the vnode at the host's previous commit.
		const previousServerContent = useRef< DocumentFragment | undefined >(
			undefined
		);
		// Server content that the current navigation brought to the kept host,
		// not yet shown.
		const owedServerContent = useRef< DocumentFragment | undefined >(
			undefined
		);
		// Server content snapshot that the element shows: what hydration found,
		// a created host's fallback, or owed content shown since. A value that
		// applies to the element leaves it showing none.
		const shownServerContent = useRef< DocumentFragment | undefined >(
			undefined
		);
		// Preact always receives empty HTML; fallback copies and later writes
		// belong to this directive's layout effect.
		const preactHtml = useRef< {
			/** The policy-free empty HTML value Preact can safely apply. */
			__html: string;
		} >();
		// Evaluated value, or undefined when evaluation or its function throws.
		let result;

		if ( ! entry ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warn(
					'The usage of data-wp-html--suffix is not supported. Please use data-wp-html instead.'
				);
			}
		} else if ( entry.uniqueId ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnUniqueIdNotSupported( 'html', entry.uniqueId );
			}
		} else {
			try {
				result = evaluate( entry );
				if ( typeof result === 'function' ) {
					result = result();
				}
			} catch {
				// An unavailable getter or function is a silent empty value.
				result = undefined;
			}
		}

		// Only supported default entries own the element's content.
		const active = !! entry && ! entry.uniqueId;
		// Pending values and the server token representation keep the content,
		// apart from showing server content that navigation brought to a kept
		// host.
		const serverHTMLRepresentation = isServerHTMLRepresentation( result );
		const preserveContent =
			result === PENDING_GETTER || serverHTMLRepresentation;
		// Tokens alone authorize non-empty HTML at the DOM boundary.
		const trusted = isDangerousHTML( result );
		// Current token payload or the policy-free removal value.
		const resolvedValue = trusted ? getDangerousHTML( result ) : emptyHTML;
		// The detached fallback captured when this vnode was built.
		const fallback = getHtmlFallback( element );
		// The page's server-rendered content, absent for template content.
		const serverContent = getHtmlServerContent( element );

		// Apply after commit; matching server nodes or content kept for the
		// representation can be adopted without another innerHTML write. The
		// vnode dependency makes this run for possible host replacements and
		// for vnodes that navigation brings from another page's markup.
		useLayoutEffect( () => {
			const node = ( element.ref as RefObject< HTMLElement > ).current!;
			const hostChanged = previousHost.current !== node;
			const inputs = [
				result,
				active,
				preserveContent,
				serverHTMLRepresentation,
				trusted,
				resolvedValue,
				element.ref,
			];
			const inputsChanged =
				previousInputs.current === null ||
				inputs.some(
					( input, index ) =>
						input !== previousInputs.current![ index ]
				);
			previousInputs.current = inputs;

			if ( hostChanged ) {
				previousHost.current = node;
				writeRecord.current = undefined;
				owedServerContent.current = undefined;
				shownServerContent.current = preserveContent
					? serverContent
					: undefined;
				if (
					active &&
					preserveContent &&
					! node.hasChildNodes() &&
					fallback?.hasChildNodes()
				) {
					node.append(
						node.ownerDocument.importNode( fallback, true )
					);
				}
			} else if ( serverContent !== previousServerContent.current ) {
				// Navigation rendered the kept host from another page's markup.
				// The content stays owed for the rest of that navigation: its
				// update, which includes the render where a getter reading the
				// new page's server context returns its new value, and the
				// `data-wp-watch` callbacks it notifies, which run a frame later
				// and can copy the new page's server value. Those that read the
				// server context are notified once the region commits, after
				// this effect, so the end is queued once the commit is over.
				// Later changes on the same page keep the content, as the value
				// rule says.
				owedServerContent.current = serverContent;
				queueMicrotask( () => {
					afterNextFrame( () => {
						if ( owedServerContent.current === serverContent ) {
							owedServerContent.current = undefined;
						}
					} );
				} );
			}
			previousServerContent.current = serverContent;

			if ( ! active ) {
				return;
			}
			// A getter reading the server context still returns the previous
			// page's value in the navigation's first render. When that value is
			// the server representation or pending and the new one isn't, the
			// content shown here is replaced later in the same update, after
			// its media started loading.
			const owed = owedServerContent.current;
			if ( preserveContent && owed ) {
				owedServerContent.current = undefined;
				// Content the server sends again unchanged keeps its nodes, and
				// what client code changed in them. Any other content is copied
				// as nodes, so no HTML string is written.
				if (
					! shownServerContent.current ||
					! isSameServerContent( shownServerContent.current, owed )
				) {
					node.replaceChildren(
						node.ownerDocument.importNode( owed, true )
					);
				}
				shownServerContent.current = owed;
				// The element shows server content, not what was last applied,
				// so the next token is compared with the DOM, as at hydration.
				writeRecord.current = undefined;
				return;
			}
			if ( ! hostChanged && ! inputsChanged ) {
				return;
			}
			if ( preserveContent ) {
				// Content kept for the server representation may differ from
				// what was last applied, so the next token is compared with the
				// DOM, as at hydration.
				if ( serverHTMLRepresentation ) {
					writeRecord.current = undefined;
				}
				return;
			}
			// Any other value writes, adopts or empties the content.
			shownServerContent.current = undefined;
			if ( ! trusted && result !== null && result !== undefined ) {
				warn(
					'data-wp-html: the value is not trusted HTML. Use asDangerousHTML() to explicitly trust the markup.'
				);
			}
			const key = String( resolvedValue );
			const plainString = typeof resolvedValue === 'string';
			const record = writeRecord.current;
			// A value matching the record is skipped: by its markup after a
			// write or an adoption, and by its kind and markup after a
			// rejected write, so a new token wrapping the rejected string isn't
			// retried but a `TrustedHTML` value with the same markup is written.
			if (
				record &&
				( 'rejected' in record
					? record.rejected === key &&
						record.plainString === plainString
					: record.applied === key )
			) {
				return;
			}
			if ( ! record && node.innerHTML === key ) {
				writeRecord.current = { applied: key };
				return;
			}
			try {
				// DOM typings do not yet accept native TrustedHTML values.
				node.innerHTML = resolvedValue as unknown as string;
				writeRecord.current = { applied: key };
			} catch ( error ) {
				// A rejected token empties the element using the policy-free empty
				// TrustedHTML value. Do not retry until the value changes.
				node.innerHTML = emptyHTML as unknown as string;
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						`data-wp-html: the browser rejected this HTML value, so the element was emptied. ${ error }`
					);
				}
				writeRecord.current = { rejected: key, plainString };
			}
		}, [
			result,
			active,
			preserveContent,
			serverHTMLRepresentation,
			trusted,
			resolvedValue,
			fallback,
			serverContent,
			element.ref,
			element,
		] );

		if ( active ) {
			preactHtml.current ??= {
				__html: emptyHTML as unknown as string,
			};
			element.props.dangerouslySetInnerHTML = preactHtml.current;
			element.props.children = undefined;
		}
	}
);
