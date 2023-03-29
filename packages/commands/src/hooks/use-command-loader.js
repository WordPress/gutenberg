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
 * Attach a command loader to the Global command menu.
 *
 * @param {import('../store/actions').WPCommandLoaderConfig} loader command loader config.
 */
export default function useCommandLoader( { page, hook, placeholder } ) {
	const { registerCommandLoader, unregisterCommandLoader } =
		useDispatch( commandsStore );
	useEffect( () => {
		registerCommandLoader( {
			page,
			hook,
			placeholder,
		} );
		return () => {
			unregisterCommandLoader( page );
		};
	}, [
		page,
		hook,
		placeholder,
		registerCommandLoader,
		unregisterCommandLoader,
	] );
}
