/**
 * WordPress dependencies
 */
import {
	createAtom,
	createDerivedAtom,
	createAtomFamily,
} from '@wordpress/stan';

export const shortcutNamesAtom = createAtom( [], 'shortcut-names' );
export const shortcutsByNameAtom = createAtom( {}, 'shortcuts-by-name' );
export const shortcutsByNameFamily = createAtomFamily( ( key ) => ( get ) =>
	get( shortcutsByNameAtom )[ key ]
);
export const shortcutsAtom = createDerivedAtom(
	( get ) => {
		const shortcutsByName = get( shortcutsByNameAtom );
		return get( shortcutNamesAtom ).map( ( id ) => shortcutsByName[ id ] );
	},
	() => {},
	false,
	'shortcuts'
);
