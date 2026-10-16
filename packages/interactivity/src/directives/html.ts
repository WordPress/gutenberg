import { useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { useLayoutEffect, warn } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';
import { emptyHTML, isDangerousHTML, getDangerousHTML } from '../html';

// data-wp-html — Inner HTML binding for explicitly trusted content.
directive(
	'html',
	( { directives: { html: htmlEntries }, element, evaluate } ) => {
		// Default entry; unsupported variants retain their original props.
		const entry = htmlEntries.find( isDefaultDirectiveSuffix );
		// Serialized HTML last applied or rejected; non-token values reset it
		// to empty HTML so returning tokens are applied again after a removal.
		const lastAppliedKey = useRef< string | undefined >( undefined );
		// Fixed at the first render. Preact writes only when creating the node;
		// all later writes, including navigation updates, belong to the effect.
		const preactHtml = useRef< {
			/** Empty HTML or the pending fallback applied only at creation. */
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
		// Pending values are the only values that leave content unchanged.
		const pending = result === PENDING_GETTER;
		// Tokens alone authorize non-empty HTML at the DOM boundary.
		const trusted = isDangerousHTML( result );
		// Current token payload or the policy-free removal value.
		const resolvedValue = trusted ? getDangerousHTML( result ) : emptyHTML;

		// Hydration never writes Preact's __html. Apply the current value only
		// after commit, adopting exactly matching unwritten server nodes.
		useLayoutEffect( () => {
			if ( ! active || pending ) {
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
			const node = ( element.ref as RefObject< HTMLElement > ).current!;
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
		}, [ result, active, pending, trusted, resolvedValue, element.ref ] );

		if ( active ) {
			preactHtml.current ??=
				pending && element.props.dangerouslySetInnerHTML?.__html
					? element.props.dangerouslySetInnerHTML
					: { __html: emptyHTML as unknown as string };
			element.props.dangerouslySetInnerHTML = preactHtml.current;
			element.props.children = undefined;
		}
	}
);
