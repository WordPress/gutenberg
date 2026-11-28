import type { ForwardedResolverArgs } from './types';

/**
 * Higher-order function which forward the resolution to another resolver with the same arguments.
 *
 * @param resolverName forwarded resolver.
 *
 * @return Enhanced resolver.
 */
const forwardResolver =
	< Name extends string >( resolverName: Name ) =>
	< Args extends Array< unknown > >( ...args: Args ) =>
	async ( {
		resolveSelect,
	}: ForwardedResolverArgs< Name, Args > ): Promise< void > => {
		await resolveSelect[ resolverName ]( ...args );
	};

export default forwardResolver;
