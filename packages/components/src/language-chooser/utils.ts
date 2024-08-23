export function reorder< T extends Array< unknown > >(
	list: T,
	srcIndex: number,
	destIndex: number
) {
	const item = list.splice( srcIndex, 1 )[ 0 ];
	list.splice( destIndex, 0, item );
	return list;
}
