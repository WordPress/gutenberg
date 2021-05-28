/**
 * WordPress dependencies
 */
import { useContext, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { shortcuts } from './';

export function RichTextShortcut( {
	type: modifier,
	character,
	onUse: callback,
} ) {
	const set = useContext( shortcuts );
	const callbackRef = useRef();
	callbackRef.current = callback;
	useEffect( () => {
		const ref = { modifier, character, callbackRef };
		set.current.add( ref );
		return () => {
			set.current.delete( ref );
		};
	}, [ modifier, character, callbackRef ] );
	return null;
}
