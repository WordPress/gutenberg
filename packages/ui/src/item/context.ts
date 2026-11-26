import { createContext, useContext } from '@wordpress/element';
import type { Density, GroupVariant } from './types';

export type GroupContextValue = {
	density: Density;
	variant: GroupVariant;
};

/**
 * `null` outside an `Item.Group`. A row then renders no list item and uses
 * its own `density` prop.
 */
export const GroupContext = createContext< GroupContextValue | null >( null );

export type RowPart = 'label' | 'description' | 'meta' | 'actions';

export type RowContextValue = {
	labelId: string;
	descriptionId: string;
	metaId: string;
	/**
	 * Called by a part when it mounts, so the row knows which of its parts
	 * exist. Returns the matching unregister.
	 */
	register: ( part: RowPart ) => () => void;
	/**
	 * Whether the row itself is a link or a button. Its label is then
	 * exposed to assistive technology only as the name of that control.
	 */
	isActivatable: boolean;
	/**
	 * Whether the row is a link that opens in a new tab. Its chevron then
	 * shows the new-tab arrow.
	 */
	opensInNewTab: boolean;
	/**
	 * Whether the row holds controls of its own. A row with controls should
	 * not also show a chevron: the glyph reads as belonging to the control
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
