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
 * @param {Object}   config            Configuration object.
 * @param {boolean=} config.isDisabled Whether the element should be disabled.
 * @return {import('react').RefCallback<HTMLElement>} Element Ref.
 *
 * @example
 * ```js
 * import { useDisabled } from '@wordpress/compose';
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

			/** A variable keeping track of the previous updates in order to restore them. */
			/** @type {Function[]} */
			const updates = [];

			const disable = () => {
				if ( node.style.getPropertyValue( 'user-select' ) !== 'none' ) {
					const previousValue =
						node.style.getPropertyValue( 'user-select' );
					node.style.setProperty( 'user-select', 'none' );
					node.style.setProperty( '-webkit-user-select', 'none' );
					updates.push( () => {
						if ( ! node.isConnected ) {
							return;
						}
						node.style.setProperty( 'user-select', previousValue );
						node.style.setProperty(
							'-webkit-user-select',
							previousValue
						);
					} );
				}

				focus.focusable.find( node ).forEach( ( focusable ) => {
					if (
						includes(
							DISABLED_ELIGIBLE_NODE_NAMES,
							focusable.nodeName
						) &&
						// @ts-ignore
						! focusable.disabled
					) {
						focusable.setAttribute( 'disabled', '' );
						updates.push( () => {
							if ( ! focusable.isConnected ) {
								return;
							}
							// @ts-ignore
							focusable.disabled = false;
						} );
					}

					if (
						focusable.nodeName === 'A' &&
						focusable.getAttribute( 'tabindex' ) !== '-1'
					) {
						const previousValue =
							focusable.getAttribute( 'tabindex' );
						focusable.setAttribute( 'tabindex', '-1' );
						updates.push( () => {
							if ( ! focusable.isConnected ) {
								return;
							}
							if ( ! previousValue ) {
								focusable.removeAttribute( 'tabindex' );
							} else {
								focusable.setAttribute(
									'tabindex',
									previousValue
								);
							}
						} );
					}

					const tabIndex = focusable.getAttribute( 'tabindex' );
					if ( tabIndex !== null && tabIndex !== '-1' ) {
						focusable.removeAttribute( 'tabindex' );
						updates.push( () => {
							if ( ! focusable.isConnected ) {
								return;
							}
							focusable.setAttribute( 'tabindex', tabIndex );
						} );
					}

					if (
						focusable.hasAttribute( 'contenteditable' ) &&
						focusable.getAttribute( 'contenteditable' ) !== 'false'
					) {
						focusable.setAttribute( 'contenteditable', 'false' );
						updates.push( () => {
							if ( ! focusable.isConnected ) {
								return;
							}
							focusable.setAttribute( 'contenteditable', 'true' );
						} );
					}

					if (
						node.ownerDocument.defaultView?.HTMLElement &&
						focusable instanceof
							node.ownerDocument.defaultView.HTMLElement
					) {
						const previousValue =
							focusable.style.getPropertyValue(
								'pointer-events'
							);
						focusable.style.setProperty( 'pointer-events', 'none' );
						updates.push( () => {
							if ( ! focusable.isConnected ) {
								return;
							}
							focusable.style.setProperty(
								'pointer-events',
								previousValue
							);
						} );
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
				updates.forEach( ( update ) => update() );
			};
		},
		[ isDisabledProp ]
	);
}
