export const filterOutDuplicatesByName = (
	currentItem: any,
	index: number,
	items: any[]
) => index === items.findIndex( ( item ) => currentItem.name === item.name );
