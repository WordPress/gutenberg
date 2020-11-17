/**
 * Internal dependencies
 */
import { createDerivedAtom } from './derived';

/**
 * @template T
 * @param {import('./types').WPAtomFamilyResolver<T>} resolver   Atom resolver.
 * @param {import('./types').WPAtomFamilyUpdater<T>}  updater    Atom updater.
 * @param {import('./types').WPCommonAtomConfig=}     atomConfig Common Atom config.
 * @return {(key:string) => import('./types').WPAtomFamilyItem<T>} Atom Family Item creator.
 */
export const createAtomFamily = ( resolver, updater, atomConfig = {} ) => {
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
				{
					...atomConfig,
					id: atomConfig.id ? atomConfig.id + '--' + key : undefined,
				}
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
