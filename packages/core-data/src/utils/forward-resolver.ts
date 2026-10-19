import type { ForwardedResolverArgs } from './types';

/**
 * Higher-order function which forward the resolution to another resolver with the same arguments.
 *
 * @param {string} resolverName forwarded resolver.
 *
 * @return {Function} Enhanced resolver.
 */
const forwardResolver =
	( resolverName: string ) =>
	( ...args: unknown[] ) =>
	async ( { resolveSelect }: ForwardedResolverArgs ): Promise< void > => {
		await resolveSelect[ resolverName ]( ...args );
	};

export default forwardResolver;
