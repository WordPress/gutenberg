import type { ReactNode } from 'react';
import type { InserterItem } from '../../store/types';
import type { InserterListItemProps } from '../inserter-list-item/types';

export interface BlockTypesListProps {
	items?: InserterItem[];
	onSelect: InserterListItemProps[ 'onSelect' ];
	onHover?: InserterListItemProps[ 'onHover' ];
	children?: ReactNode;
	label?: string;
	isDraggable?: boolean;
}
