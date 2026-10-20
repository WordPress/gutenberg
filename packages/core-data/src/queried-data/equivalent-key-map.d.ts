declare module 'equivalent-key-map' {
	// Not a `Map` subclass: it has no iterators.
	class EquivalentKeyMap< K, V > {
		constructor(
			iterable?: Iterable< readonly [ K, V ] > | EquivalentKeyMap< K, V >
		);
		readonly size: number;
		set( key: K, value: V ): this;
		get( key: K ): V | undefined;
		has( key: K ): boolean;
		delete( key: K ): boolean;
		forEach(
			callback: (
				value: V,
				key: K,
				map: EquivalentKeyMap< K, V >
			) => void,
			thisArg?: unknown
		): void;
		clear(): void;
	}
	export = EquivalentKeyMap;
}
