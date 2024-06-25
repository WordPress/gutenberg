/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { context } from '../context';

const { Provider } = context;

/**
 * Handles callbacks added to context by `useShortcut`.
 * Adding a provider allows to register contextual shortcuts
 * that are only active when a certain part of the UI is focused.
 *
 * @param {Object} props Props to pass to `div`.
 *
 * @return {Element} Component.
 */
export function ShortcutProvider( props ) {
	const [ keyboardShortcuts ] = useState( () => new Set() );

	function onKeyDown( event ) {
		if ( props.onKeyDown ) {
			props.onKeyDown( event );
		}

		for ( const keyboardShortcut of keyboardShortcuts ) {
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
