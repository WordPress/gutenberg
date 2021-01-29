/**
 * External dependencies
 */
import { ContextSystemProvider } from '@wp-g2/context';

/**
 * @param {Object} props
 * @param {string[]} [props.__unstableNextInclude]
 * @param {import('react').ReactNode} props.children
 * @param {any} props.value
 */
export function ComponentSystemProvider( {
	__unstableNextInclude = [],
	children,
	value = {},
} ) {
	if ( process.env.COMPONENT_SYSTEM_PHASE === 1 ) {
		const contextValue = { ...value };

		__unstableNextInclude.forEach( ( namespace ) => {
			const baseValue = contextValue[ namespace ] || {};
			contextValue[ namespace ] = {
				...baseValue,
				__unstableVersion: 'next',
			};
		} );

		return (
			<ContextSystemProvider value={ contextValue }>
				{ children }
			</ContextSystemProvider>
		);
	}

	return children;
}
