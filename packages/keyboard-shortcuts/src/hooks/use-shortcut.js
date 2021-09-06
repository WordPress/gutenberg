/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useEffect,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import useShortcutEventMatch from './use-shortcut-event-match';

const context = createContext();
const { Provider } = context;

export function ShortcutProvider( props ) {
	const keyboardShortcuts = useRef( new Set() );

	function onKeyDown( event ) {
		if ( props.onKeyDown ) props.onKeyDown( event );

		for ( const keyboardShortcut of keyboardShortcuts.current ) {
			keyboardShortcut( event );
		}
	}

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<Provider value={ keyboardShortcuts }>
			<div { ...props } onKeyDown={ onKeyDown } />
		</Provider>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string}   name               Shortcut name.
 * @param {Function} callback           Shortcut callback.
 * @param {Object}   options            Shortcut options.
 * @param {boolean}  options.isDisabled Whether to disable to shortut.
 */
export default function useShortcut( name, callback, { isDisabled } = {} ) {
	const shortcuts = useContext( context );
	const isMatch = useShortcutEventMatch();
	const callbackRef = useRef();
	callbackRef.current = callback;

	useEffect( () => {
		if ( isDisabled ) {
			return;
		}

		function _callback( event ) {
			if ( isMatch( name, event ) ) {
				callbackRef.current( event );
			}
		}

		shortcuts.current.add( _callback );
		return () => {
			shortcuts.current.delete( _callback );
		};
	}, [ name, isDisabled ] );
}
