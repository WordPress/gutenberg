import { createContext, useContext } from '@wordpress/element';
import type {
	ListViewContextValue,
	ListViewTreeStateContextValue,
} from './types';

/**
 * Values that never change for the lifetime of a List View, such as the
 * components passed in as props, the tree grid element ref, and the stable
 * state updaters.
 */
// Every List View provides the value; the default is never read.
export const ListViewContext = createContext( {} as ListViewContextValue );
ListViewContext.displayName = 'ListViewContext';

export const useListViewContext = () => useContext( ListViewContext );

/**
 * Expansion and drag state. Only `ListViewBranch` reads it, so the frequent
 * updates during a drag stop short of the individual rows.
 */
// Every List View provides the value; the default is never read.
export const ListViewTreeStateContext = createContext(
	{} as ListViewTreeStateContextValue
);
ListViewTreeStateContext.displayName = 'ListViewTreeStateContext';

export const useListViewTreeState = () =>
	useContext( ListViewTreeStateContext );

/**
 * The client ID of the block that was just inserted, or `null`.
 */
export const ListViewInsertedBlockContext = createContext< string | null >(
	null
);
ListViewInsertedBlockContext.displayName = 'ListViewInsertedBlockContext';

export const useInsertedBlockClientId = () =>
	useContext( ListViewInsertedBlockContext );
