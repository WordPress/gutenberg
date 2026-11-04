import { useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { isPlainObject, useLayoutEffect, warn } from '../utils';
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
 * Replaces an element's child nodes with a copy of a server content snapshot's
 * nodes, without writing an HTML string. Child nodes that already equal the
 * snapshot's, compared with `isEqualNode()`, are kept.
 *
 * @param node    The element whose content is replaced.
 * @param content The detached, script-free snapshot, left unmodified.
 */
const showServerContent = ( node: HTMLElement, content: DocumentFragment ) => {
	const contentNodes = content.childNodes;
	if (
		node.childNodes.length === contentNodes.length &&
		Array.from( node.childNodes ).every( ( child, index ) =>
			child.isEqualNode( contentNodes[ index ] )
		)
	) {
		return;
	}
	node.replaceChildren( node.ownerDocument.importNode( content, true ) );
};

// data-wp-html — Inner HTML binding for explicitly trusted content.
directive(
	'html',
	( { directives: { html: htmlEntries }, element, evaluate } ) => {
		// Default entry; unsupported variants retain their original props.
		const entry = htmlEntries.find( isDefaultDirectiveSuffix );
		// Serialized HTML last applied or rejected; non-token values reset it
		// to empty HTML so returning tokens are applied again after a removal.
		const lastAppliedKey = useRef< string | undefined >( undefined );
		// The value-rule state belongs to a host element, not its wrapper vnode.
		const previousHost = useRef< HTMLElement | null >( null );
		// Inputs are compared inside the effect so host replacements can be
		// detected on every commit without repeating unchanged value-rule work.
		const previousInputs = useRef< unknown[] | null >( null );
		// Server content snapshot of the vnode at the host's previous commit.
		const previousServerContent = useRef< DocumentFragment | undefined >(
			undefined
		);
		// Server content that navigation brought to the kept host, not yet shown.
		const owedServerContent = useRef< DocumentFragment | undefined >(
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
				lastAppliedKey.current = undefined;
				owedServerContent.current = undefined;
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
				owedServerContent.current = serverContent;
			}
			previousServerContent.current = serverContent;

			if ( ! active ) {
				return;
			}
			if ( preserveContent && owedServerContent.current ) {
				showServerContent( node, owedServerContent.current );
				owedServerContent.current = undefined;
				// The shown content differs from what was last applied, so the
				// next token is compared with the DOM, as at hydration.
				lastAppliedKey.current = undefined;
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
					lastAppliedKey.current = undefined;
				}
				return;
			}
			if ( ! trusted && result !== null && result !== undefined ) {
				warn(
					'data-wp-html: the value is not trusted HTML. Use asDangerousHTML() to explicitly trust the markup.'
				);
			}
			const key = String( resolvedValue );
			if ( lastAppliedKey.current === key ) {
				return;
			}
			if (
				lastAppliedKey.current === undefined &&
				node.innerHTML === key
			) {
				lastAppliedKey.current = key;
				return;
			}
			try {
				// DOM typings do not yet accept native TrustedHTML values.
				node.innerHTML = resolvedValue as unknown as string;
			} catch ( error ) {
				// A rejected token empties the element using the policy-free empty
				// TrustedHTML value. Do not retry until the value changes.
				node.innerHTML = emptyHTML as unknown as string;
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						`data-wp-html: the browser rejected this HTML value, so the element was emptied. ${ error }`
					);
				}
			}
			lastAppliedKey.current = key;
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
