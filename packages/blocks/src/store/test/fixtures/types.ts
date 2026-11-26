export type DeepPartial<
	T,
	Depth extends unknown[] = [],
> = Depth[ 'length' ] extends 7
	? T
	: T extends ( ...args: never[] ) => unknown
		? T
		: T extends Node
			? T
			: T extends Map< infer K, infer V >
				? Map< K, DeepPartial< V, [ ...Depth, unknown ] > >
				: T extends readonly ( infer U )[]
					? readonly DeepPartial< U, [ ...Depth, unknown ] >[]
					: T extends object
						? {
								[ P in keyof T ]?: DeepPartial<
									T[ P ],
									[ ...Depth, unknown ]
								>;
							}
						: T;
