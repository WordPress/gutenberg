/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { context } from '../context';

const { Provider } = context;

/**
 * Handles callbacks added to context by `useShortcut`.
 *
 * @param {Object} props Props to pass to `div`.
 *
 * @return {import('@wordpress/element').WPElement} Component.
 */
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
