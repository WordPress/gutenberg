export type StoreState = {
	preferences: { [ k in string ]: { [ p in string ]: any } };
	defaults: { [ k in string ]: { [ p in string ]: any } };
};

export type OmitFirstArg< F > = F extends (
	x: any,
	...args: infer P
) => infer R
	? ( ...args: P ) => R
	: never;

export interface WPPreferencesPersistenceLayer< D extends Object > {
	/**
	 * An async function that gets data from the persistence layer.
	 */
	get: () => Promise< D >;
	/**
	 * A function that sets data in the persistence layer.
	 */
	set: ( value: D ) => void;
}

export type ActionObject<
	T extends string,
	D extends Record< Exclude< string, 'type' >, any > = {},
> = {
	type: T;
} & D;
