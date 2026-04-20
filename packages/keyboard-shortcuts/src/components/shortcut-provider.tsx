/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { context } from '../context';

const { Provider } = context;

type ShortcutCallback = ( event: KeyboardEvent ) => void;

interface ShortcutProviderProps extends React.HTMLAttributes< HTMLDivElement > {
	onKeyDown?: ( event: React.KeyboardEvent< HTMLDivElement > ) => void;
}

/**
 * Handles callbacks added to context by `useShortcut`.
 * Adding a provider allows to register contextual shortcuts
 * that are only active when a certain part of the UI is focused.
 *
 * @param props Props to pass to `div`.
 *
 * @return Component.
 */
export function ShortcutProvider( props: ShortcutProviderProps ) {
	const [ keyboardShortcuts ] = useState(
		() => new Set< ShortcutCallback >()
	);

	function onKeyDown( event: React.KeyboardEvent< HTMLDivElement > ) {
		if ( props.onKeyDown ) {
			props.onKeyDown( event );
		}

		// Convert React event to native KeyboardEvent for compatibility
		const nativeEvent = event.nativeEvent;
		for ( const keyboardShortcut of keyboardShortcuts ) {
			keyboardShortcut( nativeEvent );
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
