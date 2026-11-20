import { createContext, useContext } from '@wordpress/element';
import type { Density } from './types';

export type GroupContextValue = {
	/**
	 * Whether a row is inside a group, in which case it wraps itself in a
	 * list item. On its own a row renders its element and nothing more.
	 */
	inGroup: boolean;
	density: Density;
};

export const GroupContext = createContext< GroupContextValue >( {
	inGroup: false,
	density: 'comfortable',
} );

export function useGroupContext() {
	return useContext( GroupContext );
}

export type RowContextValue = {
	labelId: string;
	descriptionId: string;
	metaId: string;
	/**
	 * Called by a part when it mounts, so the row knows which of its
	 * labelling parts exist. Returns the matching unregister.
	 */
	register: (
		part: 'label' | 'description' | 'meta' | 'actions'
	) => () => void;
	/**
	 * The ids that describe a control inside the row: its label and its
	 * description, so "Edit" is announced as "Edit, Soft shadow".
	 */
	actionDescribedBy: string | undefined;
	/**
	 * Whether the row holds controls of its own. A row with controls should
	 * not also show a chevron: the glyph reads as belonging to the button
	 * beside it rather than to the row.
	 */
	hasActions: boolean;
};

export const RowContext = createContext< RowContextValue | null >( null );

/**
 * The row a part belongs to.
 *
 * @param part The part's name, used in the error when it is misplaced.
 */
export function useRowContext( part: string ) {
	const context = useContext( RowContext );

	if ( ! context && process.env.NODE_ENV !== 'production' ) {
		throw new Error(
			`Item: <Item.${ part }> must be rendered inside an <Item.LinkRow>, <Item.ButtonRow> or <Item.ContentRow>.`
		);
	}

	return context;
}
