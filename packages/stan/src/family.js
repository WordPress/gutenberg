/**
 * Internal dependencies
 */
import { createDerivedAtom } from './derived';

/**
 *
 * @param {import('./types').WPAtomFamilyResolver<any>} resolver
 * @param {import('./types').WPAtomFamilyUpdater}       updater
 * @param {boolean}                                     isAsync
 * @param {string=}                                     id
 *
 * @return {(key:string) => import('./types').WPAtomFamilyItem} Atom Family Item creator.
 */
export const createAtomFamily = ( resolver, updater, isAsync, id ) => {
	const config = {
		/**
		 *
		 * @param {any} key Key of the family item.
		 * @return {import('./types').WPAtom<any>} Atom.
		 */
		createAtom( key ) {
			return createDerivedAtom(
				resolver( key ),
				updater ? updater( key ) : undefined,
				isAsync,
				id ? id + '--' + key : undefined
			);
		},
	};

	return ( key ) => {
		return {
			type: 'family',
			config,
			key,
		};
	};
};
