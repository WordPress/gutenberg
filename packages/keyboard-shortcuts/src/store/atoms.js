/**
 * WordPress dependencies
 */
import { createAtom, createDerivedAtom } from '@wordpress/stan';

export const shortcutNamesAtom = createAtom( [], { id: 'shortcut-names' } );
export const shortcutsByNameAtom = createAtom(
	{},
	{ id: 'shortcuts-by-name' }
);
export const shortcutsAtom = createDerivedAtom(
	( { get } ) => {
		const shortcutsByName = get( shortcutsByNameAtom );
		return get( shortcutNamesAtom ).map( ( id ) => shortcutsByName[ id ] );
	},
	() => {},
	{ id: 'shortcuts' }
);

export const rootAtoms = [ shortcutNamesAtom, shortcutsByNameAtom ];
