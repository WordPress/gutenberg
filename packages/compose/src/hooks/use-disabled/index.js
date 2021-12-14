/**
 * External dependencies
 */
import { includes, debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useLayoutEffect, useRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

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
 * @return {import('react').RefObject<HTMLElement>} Element Ref.
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
	/** @type {import('react').RefObject<HTMLElement>} */
	const node = useRef( null );

	const disable = () => {
		if ( ! node.current ) {
			return;
		}

		focus.focusable.find( node.current ).forEach( ( focusable ) => {
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
		} );
	};

	// Debounce re-disable since disabling process itself will incur
	// additional mutations which should be ignored.
	const debouncedDisable = useCallback(
		debounce( disable, undefined, { leading: true } ),
		[]
	);

	useLayoutEffect( () => {
		disable();

		/** @type {MutationObserver | undefined} */
		let observer;
		if ( node.current ) {
			observer = new window.MutationObserver( debouncedDisable );
			observer.observe( node.current, {
				childList: true,
				attributes: true,
				subtree: true,
			} );
		}

		return () => {
			if ( observer ) {
				observer.disconnect();
			}
			debouncedDisable.cancel();
		};
	}, [] );

	return node;
}
