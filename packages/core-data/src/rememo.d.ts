declare module 'rememo' {
	/**
	 * This comes from the following SO answer:
	 * https://stackoverflow.com/questions/50011616/typescript-change-function-type-so-that-it-returns-new-value
	 *
	 * It ties the key function argument types to those of the select function.
	 * It is a bit verbose unfortunately, shorter solutions are welcome.
	 */
	type IsValidArg<T> = T extends object ? keyof T extends never ? false : true : true;
	type ReplaceReturnType<T, TNewReturn> = T extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E, f: infer F, g: infer G, h: infer H, i: infer I, j: infer J) => infer R ? (
		IsValidArg<J> extends true ? (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J) => TNewReturn :
		IsValidArg<I> extends true ? (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I) => TNewReturn :
		IsValidArg<H> extends true ? (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => TNewReturn :
		IsValidArg<G> extends true ? (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => TNewReturn :
		IsValidArg<F> extends true ? (a: A, b: B, c: C, d: D, e: E, f: F) => TNewReturn :
		IsValidArg<E> extends true ? (a: A, b: B, c: C, d: D, e: E) => TNewReturn :
		IsValidArg<D> extends true ? (a: A, b: B, c: C, d: D) => TNewReturn :
		IsValidArg<C> extends true ? (a: A, b: B, c: C) => TNewReturn :
		IsValidArg<B> extends true ? (a: A, b: B) => TNewReturn :
		IsValidArg<A> extends true ? (a: A) => TNewReturn :
		() => TNewReturn
	) : never
	export default function createSelector< T extends Function >(
		select: T,
		// @TODO: Figure out why this doesn't work with
		//        getEntityRecord when it also has a Q generic
		//        In the next iteration perhaps?
		// makeKey?: ReplaceReturnType<T, unknown>
		makeKey?: any
	): T;
}
