import { useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { useLayoutEffect, warn } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';
import { isDangerousHTML, getDangerousHTML } from '../html';

// A single, frozen object reused for every render of every `data-wp-html`
// element. Preact only writes `dangerouslySetInnerHTML` to the DOM itself
// when the `__html` value it's given differs from the previous render's; by
// never changing it, Preact's own diffing never touches this element's
// content, leaving that entirely to the `useLayoutEffect` below. This also
// keeps Preact from clearing the element when a render doesn't resolve to
// trusted HTML, which it would otherwise do for an element that previously
// had `dangerouslySetInnerHTML` but no longer does.
const STABLE_EMPTY_HTML = Object.freeze( { __html: '' } );

// data-wp-html — Inner HTML binding, for content explicitly trusted via `asDangerousHTML()`.
directive(
	'html',
	( { directives: { html: htmlEntries }, element, evaluate } ) => {
		const entry = htmlEntries.find( isDefaultDirectiveSuffix );
		// Persists the last trusted HTML value actually resolved, so a later
		// value that isn't trusted HTML (a plain string, `null`, `undefined`,
		// a pending getter…) leaves the existing content in place instead of
		// clearing it.
		const lastValue = useRef<
			ReturnType< typeof getDangerousHTML > | undefined
		>( undefined );
		// The string (or serialized `TrustedHTML`) representation of the
		// value last successfully written to the DOM, so the effect below
		// can skip repeating a write — and, if it previously failed, a
		// warning — for a value it has already applied. A `TrustedHTML`
		// object returned fresh from a getter on every render wouldn't
		// otherwise compare equal to the previous render's by reference.
		const lastWrittenKey = useRef< string | undefined >( undefined );

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
			let result;
			try {
				result = evaluate( entry );
			} catch {
				result = undefined;
			}
			if ( result !== PENDING_GETTER ) {
				if ( typeof result === 'function' ) {
					result = result();
				}
				if ( isDangerousHTML( result ) ) {
					lastValue.current = getDangerousHTML( result );
				}
			}
		}

		const resolvedValue = lastValue.current;

		// Preact doesn't apply `dangerouslySetInnerHTML` while hydrating, on
		// the assumption that server-rendered content already matches what
		// would be rendered. That assumption doesn't hold here: the server
		// intentionally leaves `data-wp-html` unprocessed, so the element's
		// content has to be applied here — the same way `data-wp-style`
		// re-applies styles after hydration.
		useLayoutEffect( () => {
			if ( resolvedValue === undefined ) {
				return;
			}

			const key = String( resolvedValue );
			if ( lastWrittenKey.current === key ) {
				return;
			}

			const node = ( element.ref as RefObject< HTMLElement > ).current!;
			try {
				// `resolvedValue` may be a native `TrustedHTML` value from a
				// site-provided policy, which the DOM lib types this project
				// currently targets don't yet know `innerHTML` accepts.
				node.innerHTML = resolvedValue as unknown as string;
				lastWrittenKey.current = key;
			} catch ( error ) {
				// Most likely a site enforcing Trusted Types with no default
				// policy, given a plain string. Leave the existing content
				// (server-rendered, or from a previous successful write) in
				// place rather than clearing it, and don't retry until the
				// value itself changes.
				lastWrittenKey.current = key;
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						`data-wp-html: the browser rejected this HTML value, so the element's existing content was left in place. ${ error }`
					);
				}
			}
		}, [ resolvedValue, element.ref ] );

		if ( resolvedValue === undefined ) {
			// Nothing has ever resolved to trusted HTML for this element:
			// leave the pre-existing (usually server-rendered) content as is.
			return;
		}

		element.props.dangerouslySetInnerHTML = STABLE_EMPTY_HTML;
		element.props.children = undefined;
	}
);
