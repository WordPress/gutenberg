type ItemSize = 'small' | 'medium' | 'large';

export interface ItemGroupProps {
	isBordered?: boolean;
	isRounded?: boolean;
	isSeparated?: boolean;
	size?: ItemSize;
}

export interface ItemProps {
	isAction?: boolean;
	size?: ItemSize;
}
