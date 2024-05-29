/**
 * Internal dependencies
 */
import { debounce } from '../../utils/debounce';
import useRefEffect from '../use-ref-effect';

/**
 * In some circumstances, such as block previews, all focusable DOM elements
 * (input fields, links, buttons, etc.) need to be disabled. This hook adds the
 * behavior to disable nested DOM elements to the returned ref.
 *
 * If you can, prefer the use of the inert HTML attribute.
 *
 * @param {Object}   config            Configuration object.
 * @param {boolean=} config.isDisabled Whether the element should be disabled.
 * @return {import('react').RefCallback<HTMLElement>} Element Ref.
 *
 * @example
 * ```js
 * import { useDisabled } from '@wordpress/compose';
 *
 * const DisabledExample = () => {
 * 	const disabledRef = useDisabled();
 *	return (
 *		<div ref={ disabledRef }>
 *			<a href="#">This link will have tabindex set to -1</a>
 *			<input placeholder="This input will have the disabled attribute added to it." type="text" />
 *		</div>
 *	);
 * };
 * ```
 */
export default function useDisabled( {
	isDisabled: isDisabledProp = false,
} = {} ) {
	return useRefEffect(
		( node ) => {
			if ( isDisabledProp ) {
				return;
			}

			const defaultView = node?.ownerDocument?.defaultView;
			if ( ! defaultView ) {
				return;
			}

			/** A variable keeping track of the previous updates in order to restore them. */
			const updates: Function[] = [];
			const disable = () => {
				node.childNodes.forEach( ( child ) => {
					if ( ! ( child instanceof defaultView.HTMLElement ) ) {
						return;
					}
					if ( ! child.getAttribute( 'inert' ) ) {
						child.setAttribute( 'inert', 'true' );
						updates.push( () => {
							child.removeAttribute( 'inert' );
						} );
					}
				} );
			};

			// Debounce re-disable since disabling process itself will incur
			// additional mutations which should be ignored.
			const debouncedDisable = debounce( disable, 0, {
				leading: true,
			} );
			disable();

			/** @type {MutationObserver | undefined} */
			const observer = new window.MutationObserver( debouncedDisable );
			observer.observe( node, {
				childList: true,
			} );

			return () => {
				if ( observer ) {
					observer.disconnect();
				}
				debouncedDisable.cancel();
				updates.forEach( ( update ) => update() );
			};
		},
		[ isDisabledProp ]
	);
}
