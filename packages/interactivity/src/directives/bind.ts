import { type RefObject } from 'preact';
import { directive, isNonDefaultDirectiveSuffix } from '../hooks';
import { useInit } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';

// data-wp-bind--[attribute] binding.
directive( 'bind', ( { directives: { bind }, element, evaluate } ) => {
	bind.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
		if ( entry.uniqueId ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnUniqueIdNotSupported( 'bind', entry.uniqueId );
			}
			return;
		}
		const attribute = entry.suffix;
		let result = evaluate( entry );
		if ( result === PENDING_GETTER ) {
			return;
		}
		if ( typeof result === 'function' ) {
			result = result();
		}
		element.props[ attribute ] = result;

		/*
		 * This is necessary because Preact doesn't change the attributes on the
		 * hydration, so we have to do it manually. It only needs to do it the
		 * first time. After that, Preact will handle the changes.
		 */
		useInit( () => {
			const el = ( element.ref as RefObject< HTMLElement > ).current!;

			/*
			 * We set the value directly to the corresponding HTMLElement instance
			 * property excluding the following special cases. We follow Preact's
			 * logic: https://github.com/preactjs/preact/blob/10.29.1/src/diff/props.js#L115-L129
			 */
			if ( attribute === 'style' ) {
				if ( typeof result === 'string' ) {
					el.style.cssText = result;
				}
				return;
			} else if (
				attribute !== 'width' &&
				attribute !== 'height' &&
				attribute !== 'href' &&
				attribute !== 'list' &&
				attribute !== 'form' &&
				/*
				 * The value for `tabindex` follows the parsing rules for an
				 * integer. If that fails, or if the attribute isn't present, then
				 * the browsers should "follow platform conventions to determine if
				 * the element should be considered as a focusable area",
				 * practically meaning that most elements get a default of `-1` (not
				 * focusable), but several also get a default of `0` (focusable in
				 * order after all elements with a positive `tabindex` value).
				 *
				 * @see https://html.spec.whatwg.org/#tabindex-value
				 */
				attribute !== 'tabIndex' &&
				attribute !== 'download' &&
				attribute !== 'rowSpan' &&
				attribute !== 'colSpan' &&
				attribute !== 'role' &&
				attribute !== 'popover' &&
				attribute in el
			) {
				try {
					el[ attribute ] =
						result === null || result === undefined ? '' : result;
					return;
				} catch {}
			}
			/*
			 * aria- and data- attributes have no boolean representation.
			 * A `false` value is different from the attribute not being
			 * present, so we can't remove it.
			 * We follow Preact's logic: https://github.com/preactjs/preact/blob/10.29.1/src/diff/props.js#L138-L150
			 */
			if (
				result !== null &&
				result !== undefined &&
				( result !== false || attribute[ 4 ] === '-' )
			) {
				el.setAttribute(
					attribute,
					attribute === 'popover' && result === true ? '' : result
				);
			} else {
				el.removeAttribute( attribute );
			}
		} );
	} );
} );
