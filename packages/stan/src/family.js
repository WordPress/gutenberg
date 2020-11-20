/**
 * Internal dependencies
 */
import { createDerivedAtom } from './derived';

/** @typedef {import('./types').WPCommonAtomConfig} WPCommonAtomConfig */
/**
 * @template T
 * @typedef {import("./types").WPAtomFamilyResolver<T>} WPAtomFamilyResolver
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomFamilyUpdater<T>} WPAtomFamilyUpdater
 */
/**
 * @template T
 * @typedef {import("./types").WPAtom<T>} WPAtom
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomFamilyItem<T>} WPAtomFamilyItem
 */

/**
 * @template T
 * @param {WPAtomFamilyResolver<T>} resolver   Atom resolver.
 * @param {WPAtomFamilyUpdater<T>}  updater    Atom updater.
 * @param {WPCommonAtomConfig=}     atomConfig Common Atom config.
 * @return {(key:string) => WPAtomFamilyItem<T>} Atom family item creator.
 */
export const createAtomFamily = ( resolver, updater, atomConfig = {} ) => {
	const config = {
		/**
		 *
		 * @param {any} key Key of the family item.
		 * @return {WPAtom<any>} Atom.
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
