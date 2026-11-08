import type { InserterItem } from '../../store/types';
import type { InserterListboxItemProps } from '../inserter-listbox/types';

export type InserterListItemProps = Omit<
	InserterListboxItemProps,
	'onSelect' | 'children'
> & {
	className?: string;
	isFirst?: boolean;
	item: InserterItem;
	/** Called with the item, and whether the modifier key was pressed. */
	onSelect: ( item: InserterItem, isModifierKeyPressed?: boolean ) => void;
	onHover: ( item: InserterItem | null ) => void;
	isDraggable?: boolean;
	rowId?: string;
};
