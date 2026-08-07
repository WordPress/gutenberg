export type ItemPopupSize = 'default' | 'small';

export function normalizeItemPopupSize(
	size: ItemPopupSize | 'compact' | undefined
): ItemPopupSize {
	return size === 'small' ? 'small' : 'default';
}

export function getItemPopupSizeClassName(
	size: ItemPopupSize | 'compact' | undefined,
	styles: Record< string, string >
): string | undefined {
	return normalizeItemPopupSize( size ) === 'small'
		? styles[ 'is-size-small' ]
		: undefined;
}
