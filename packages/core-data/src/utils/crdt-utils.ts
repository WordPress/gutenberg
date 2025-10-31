/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * A YMapRecord represents the shape of the data stored in a Y.Map.
 */
export type YMapRecord = Record< string, unknown >;

/**
 * A wrapper around Y.Map to provide type safety. The generic type accepted by
 * Y.Map represents the union of possible values of the map, which are varied in
 * many cases. This type is accurate, but its non-specificity requires aggressive
 * type narrowing or type casting / destruction with `as`.
 *
 * This type provides type enhancements so that the correct value type can be
 * inferred based on the provided key. It is just a type wrap / overlay, and
 * does not change the runtime behavior of Y.Map.
 *
 * This interface cannot extend Y.Map directly due to the limitations of
 * TypeScript's structural typing. One negative consequence of this is that
 * `instanceof` checks against Y.Map continue to work at runtime but will blur
 * the type at compile time. To navigate this, use the `isYMap` function below.
 */
export interface YMapWrap< T extends YMapRecord > extends Y.AbstractType< T > {
	delete: < K extends keyof T >( key: K ) => void;
	forEach: (
		callback: (
			value: T[ keyof T ],
			key: keyof T,
			map: YMapWrap< T >
		) => void
	) => void;
	has: < K extends keyof T >( key: K ) => boolean;
	get: < K extends keyof T >( key: K ) => T[ K ] | undefined;
	set: < K extends keyof T >( key: K, value: T[ K ] ) => void;
	toJSON: () => T;
	// add types for other Y.Map methods as needed
}

/**
 * Get or create a root-level Map for the given Y.Doc. Use this instead of
 * doc.getMap() for additional type safety.
 *
 * @param doc Y.Doc
 * @param key Map key
 */
export function getRootMap< T extends YMapRecord >(
	doc: Y.Doc,
	key: string
): YMapWrap< T > {
	return doc.getMap< T >( key ) as unknown as YMapWrap< T >;
}

/**
 * Create a new Y.Map (provided with YMapWrap type), optionally initialized with
 * data. Use this instead of `new Y.Map()` for additional type safety.
 *
 * @param partial Partial data to initialize the map with.
 */
export function createYMap< T extends YMapRecord >(
	partial: Partial< T > = {}
): YMapWrap< T > {
	return new Y.Map( Object.entries( partial ) ) as unknown as YMapWrap< T >;
}

/**
 * Type guard to check if a value is a Y.Map without losing type information.
 *
 * @param value Value to check.
 */
export function isYMap< T extends YMapRecord >(
	value: YMapWrap< T > | undefined
): value is YMapWrap< T > {
	return value instanceof Y.Map;
}
