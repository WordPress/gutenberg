type ItemSize = 'small' | 'medium' | 'large';

export interface ItemGroupProps {
	bordered?: boolean;
	rounded?: boolean;
	separated?: boolean;
	size?: ItemSize;
}

export interface ItemProps {
	action?: boolean;
	size?: ItemSize;
}
