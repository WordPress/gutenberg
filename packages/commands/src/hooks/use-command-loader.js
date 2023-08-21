/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

/**
 * Attach a command loader to the command palette.
 *
 * @param {import('../store/actions').WPCommandLoaderConfig} loader command loader config.
 */
export default function useCommandLoader( loader ) {
	const { registerCommandLoader, unregisterCommandLoader } =
		useDispatch( commandsStore );
	useEffect( () => {
		registerCommandLoader( {
			name: loader.name,
			hook: loader.hook,
			context: loader.context,
		} );
		return () => {
			unregisterCommandLoader( loader.name );
		};
	}, [
		loader.name,
		loader.hook,
		loader.context,
		registerCommandLoader,
		unregisterCommandLoader,
	] );
}
