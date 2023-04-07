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
export default function useCommandLoader( {
	name,
	group,
	hook,
	isNested,
	placeholder,
} ) {
	const { registerCommandLoader, unregisterCommandLoader } =
		useDispatch( commandsStore );
	useEffect( () => {
		registerCommandLoader( {
			name,
			group,
			hook,
			isNested,
			placeholder,
		} );
		return () => {
			unregisterCommandLoader( name, group );
		};
	}, [
		name,
		group,
		hook,
		isNested,
		placeholder,
		registerCommandLoader,
		unregisterCommandLoader,
	] );
}
