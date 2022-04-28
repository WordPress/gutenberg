/**
 * External dependencies
 */
import { includes, debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * Names of control nodes which qualify for disabled behavior.
 *
 * See WHATWG HTML Standard: 4.10.18.5: "Enabling and disabling form controls: the disabled attribute".
 *
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#enabling-and-disabling-form-controls:-the-disabled-attribute
 *
 * @type {string[]}
 */
const DISABLED_ELIGIBLE_NODE_NAMES = [
	'BUTTON',
	'FIELDSET',
	'INPUT',
	'OPTGROUP',
	'OPTION',
	'SELECT',
	'TEXTAREA',
];

/**
 * In some circumstances, such as block previews, all focusable DOM elements
 * (input fields, links, buttons, etc.) need to be disabled. This hook adds the
 * behavior to disable nested DOM elements to the returned ref.
 *
 * @return {import('react').RefCallback<HTMLElement>} Element Ref.
 *
 * @example
 * ```js
 * import { __experimentalUseDisabled as useDisabled } from '@wordpress/compose';
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
export default function useDisabled() {
	return useRefEffect( ( node ) => {
		const disable = () => {
			node.style.setProperty( 'user-select', 'none' );
			node.style.setProperty( '-webkit-user-select', 'none' );
			focus.focusable.find( node ).forEach( ( focusable ) => {
				if (
					includes( DISABLED_ELIGIBLE_NODE_NAMES, focusable.nodeName )
				) {
					focusable.setAttribute( 'disabled', '' );
				}

				if ( focusable.nodeName === 'A' ) {
					focusable.setAttribute( 'tabindex', '-1' );
				}

				const tabIndex = focusable.getAttribute( 'tabindex' );
				if ( tabIndex !== null && tabIndex !== '-1' ) {
					focusable.removeAttribute( 'tabindex' );
				}

				if ( focusable.hasAttribute( 'contenteditable' ) ) {
					focusable.setAttribute( 'contenteditable', 'false' );
				}

				if (
					node.ownerDocument.defaultView?.HTMLElement &&
					focusable instanceof
						node.ownerDocument.defaultView.HTMLElement
				) {
					focusable.style.setProperty( 'pointer-events', 'none' );
				}
			} );
		};

		// Debounce re-disable since disabling process itself will incur
		// additional mutations which should be ignored.
		const debouncedDisable = debounce( disable, undefined, {
			leading: true,
		} );
		disable();

		/** @type {MutationObserver | undefined} */
		const observer = new window.MutationObserver( debouncedDisable );
		observer.observe( node, {
			childList: true,
			attributes: true,
			subtree: true,
		} );

		return () => {
			if ( observer ) {
				observer.disconnect();
			}
			debouncedDisable.cancel();
		};
	}, [] );
}
