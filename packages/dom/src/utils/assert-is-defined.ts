export function assertIsDefined< T >(
	val: T,
	name: string
): asserts val is NonNullable< T > {
	if (
		process.env.NODE_ENV !== 'production' &&
		( val === undefined || val === null )
	) {
		throw new Error(
			`Expected '${ name }' to be defined, but received ${ val }`
		);
	}
}
