/**
 * External dependencies
 */
import { includes, debounce } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useLayoutEffect,
	useRef,
} from '@wordpress/element';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { StyledWrapper } from './styles/disabled-styles';

const { Consumer, Provider } = createContext( false );

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

function Disabled( { className, children, ...props } ) {
	const node = useRef();

	const disable = () => {
		focus.focusable.find( node.current ).forEach( ( focusable ) => {
			if (
				includes( DISABLED_ELIGIBLE_NODE_NAMES, focusable.nodeName )
			) {
				focusable.setAttribute( 'disabled', '' );
			}

			if ( focusable.nodeName === 'A' ) {
				focusable.setAttribute( 'tabindex', -1 );
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
		debounce( disable, { leading: true } ),
		[]
	);

	useLayoutEffect( () => {
		disable();

		const observer = new window.MutationObserver( debouncedDisable );
		observer.observe( node.current, {
			childList: true,
			attributes: true,
			subtree: true,
		} );

		return () => {
			observer.disconnect();
			debouncedDisable.cancel();
		};
	}, [] );

	return (
		<Provider value={ true }>
			<StyledWrapper
				ref={ node }
				className={ classnames( className, 'components-disabled' ) }
				{ ...props }
			>
				{ children }
			</StyledWrapper>
		</Provider>
	);
}

Disabled.Consumer = Consumer;

export default Disabled;
