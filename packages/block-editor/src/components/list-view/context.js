/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Values that never change for the lifetime of a List View, such as the
 * components passed in as props, the tree grid element ref, and the stable
 * state updaters.
 */
export const ListViewContext = createContext( {} );
ListViewContext.displayName = 'ListViewContext';

export const useListViewContext = () => useContext( ListViewContext );

/**
 * Expansion and drag state. Only `ListViewBranch` reads it, so the frequent
 * updates during a drag stop short of the individual rows.
 */
export const ListViewTreeStateContext = createContext( {} );
ListViewTreeStateContext.displayName = 'ListViewTreeStateContext';

export const useListViewTreeState = () =>
	useContext( ListViewTreeStateContext );

/**
 * The client ID of the block that was just inserted, or `null`.
 */
export const ListViewInsertedBlockContext = createContext( null );
ListViewInsertedBlockContext.displayName = 'ListViewInsertedBlockContext';

export const useInsertedBlockClientId = () =>
	useContext( ListViewInsertedBlockContext );
