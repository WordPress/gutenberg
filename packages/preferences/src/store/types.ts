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

export type ActionObject<
	T extends string,
	D extends Record< Exclude< string, 'type' >, any > = {},
> = {
	type: T;
} & D;
