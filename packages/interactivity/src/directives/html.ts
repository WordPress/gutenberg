import { useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { useInit, warn } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';
import { isDangerousHTML } from '../html';

// data-wp-html — Inner HTML binding, for content explicitly trusted via `asDangerousHTML()`.
directive(
	'html',
	( { directives: { html: htmlEntries }, element, evaluate } ) => {
		const entry = htmlEntries.find( isDefaultDirectiveSuffix );
		// Persists the last HTML that was actually rendered, so a later value
		// that isn't trusted HTML (a plain string, `null`, `undefined`, a
		// pending getter…) leaves the existing content in place instead of
		// clearing it.
		const lastHtml = useRef< string | undefined >( undefined );

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
					lastHtml.current = result.html;
				}
			}
		}

		const resolvedHtml = lastHtml.current;

		// Preact doesn't apply `dangerouslySetInnerHTML` while hydrating, on
		// the assumption that server-rendered content already matches what
		// would be rendered. That assumption doesn't hold here: the server
		// intentionally leaves `data-wp-html` unprocessed, so the first
		// render has to apply the HTML itself — the same way `data-wp-style`
		// re-applies styles after hydration.
		useInit( () => {
			if ( lastHtml.current !== undefined ) {
				( element.ref as RefObject< HTMLElement > ).current!.innerHTML =
					lastHtml.current;
			}
		} );

		if ( resolvedHtml === undefined ) {
			// Nothing has ever resolved to trusted HTML for this element:
			// leave the pre-existing (usually server-rendered) content as is.
			return;
		}

		element.props.dangerouslySetInnerHTML = { __html: resolvedHtml };
		element.props.children = undefined;
	}
);
