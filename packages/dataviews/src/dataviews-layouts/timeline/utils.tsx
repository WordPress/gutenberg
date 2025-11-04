export function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}
