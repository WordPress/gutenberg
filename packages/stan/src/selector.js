/**
 * Internal dependencies
 */
import { createDerivedAtom } from './derived';

/** @typedef {import('./types').WPCommonAtomConfig} WPCommonAtomConfig */
/**
 * @template T
 * @typedef {import("./types").WPAtomSelectorResolver<T>} WPAtomSelectorResolver
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomSelectorUpdater<T>} WPAtomSelectorUpdater
 */
/**
 * @template T
 * @typedef {import("./types").WPAtom<T>} WPAtom
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomSelector<T>} WPAtomSelector
 */

/**
 * @template T
 * @param {WPAtomSelectorResolver<T>} resolver     Atom resolver.
 * @param {WPAtomSelectorUpdater<T>}  updater      Atom updater.
 * @param {WPCommonAtomConfig=}       atomConfig   Common Atom config.
 * @return {(...args:any[]) => WPAtomSelector<T>} Atom selector creator.
 */
export const createAtomSelector = ( resolver, updater, atomConfig = {} ) => {
	const config = {
		/**
		 * @param {...any[]} args Selector arguments
		 * @return {WPAtom<any>} Atom.
		 */
		createAtom( ...args ) {
			return createDerivedAtom(
				resolver( ...args ),
				updater ? updater( ...args ) : undefined,
				{
					...atomConfig,
				}
			);
		},
	};

	return ( ...args ) => {
		return {
			type: 'selector',
			config,
			args,
		};
	};
};
