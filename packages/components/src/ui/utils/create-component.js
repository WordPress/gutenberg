/**
 * External dependencies
 */
import { contextConnect } from '@wp-g2/context';
import { identity } from 'lodash';

/**
 * Internal dependencies
 */
import { View } from '../view';

/**
 * Factory that creates a React component.
 *
 * @template {import('reakit-utils/types').As} T
 * @template {import('@wp-g2/create-styles').ViewOwnProps<{}, T>} P
 * @param {import('./types').Options<T, P>} options Options to customize the component.
 * @return {import('@wp-g2/create-styles').PolymorphicComponent<T, import('@wp-g2/create-styles').PropsFromViewOwnProps<P>>} New React component.
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
