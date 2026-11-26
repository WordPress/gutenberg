import { createContext, useContext } from '@wordpress/element';
import type { GroupVariant } from './types';

/**
 * The variant of the group a row is in, or `null` outside an `Item.Group`.
 * A row outside a group renders no list item and uses its own `density`
 * prop. Inside a group, rows inherit the density of the group through CSS.
 */
export const GroupContext = createContext< GroupVariant | null >( null );

export type RowPart = 'label' | 'description' | 'meta' | 'actions' | 'chevron';

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
