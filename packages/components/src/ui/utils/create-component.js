/**
 * External dependencies
 */
import { identity } from 'lodash';

/**
 * Internal dependencies
 */
import { contextConnect } from '../context';
import { View } from '../view';

/**
 * Factory that creates a React component.
 *
 * @template {import('reakit-utils/types').As} T
 * @template {import('../context').ViewOwnProps<{}, T>} P
 * @param {import('./types').Options<T, P>} options Options to customize the component.
 * @return {import('../context').PolymorphicComponent<T, import('../context').PropsFromViewOwnProps<P>>} New React component.
 */
/* eslint-disable jsdoc/no-undefined-types */
export const createComponent = ( {
	as,
	name = 'Component',
	useHook = identity,
	memo = true,
} ) => {
	/**
	 * @param {P} props
	 * @param {import('react').Ref<T>} forwardedRef
	 */
	function Component( props, forwardedRef ) {
		const otherProps = useHook( props );

		return (
			<View as={ as || 'div' } { ...otherProps } ref={ forwardedRef } />
		);
	}

	Component.displayName = name;

	// @ts-ignore
	return contextConnect( Component, name, { memo } );
};
/* eslint-enable jsdoc/no-undefined-types */
