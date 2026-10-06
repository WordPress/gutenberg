import { useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { useLayoutEffect, warn } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';
import { isDangerousHTML, getDangerousHTML } from '../html';

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
		// The fallback object supplied by toVdom() before trusted HTML resolves.
		// Keeping its __html unchanged thereafter prevents Preact from writing
		// content, leaving all trusted HTML writes to the layout effect.
		const fallbackHtml = useRef( element.props.dangerouslySetInnerHTML );

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
			// A throwing getter or function supplies no new HTML value.
			let result;
			try {
				result = evaluate( entry );
				if ( typeof result === 'function' ) {
					result = result();
				}
			} catch {
				result = undefined;
			}
			if ( result !== PENDING_GETTER ) {
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

			// Before the first write, the element still holds its
			// server-rendered content. If that already serializes to the
			// same HTML, keep its nodes instead of replacing them with
			// identical ones, which would lose focus, selection, form input,
			// or embedded media state.
			if (
				lastWrittenKey.current === undefined &&
				node.innerHTML === key
			) {
				lastWrittenKey.current = key;
				return;
			}

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
			// Until a token resolves, Preact uses the current fallback, including
			// on created elements or when navigation supplies a new fallback.
			fallbackHtml.current = element.props.dangerouslySetInnerHTML;
			return;
		}

		element.props.dangerouslySetInnerHTML = fallbackHtml.current;
		element.props.children = undefined;
	}
);
