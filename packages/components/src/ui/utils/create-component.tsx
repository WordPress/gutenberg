/**
 * External dependencies
 */
import { contextConnect } from '@wp-g2/context';
import { identity } from 'lodash';
import type {
	PolymorphicComponent,
	PropsFromViewOwnProps,
	ElementTypeFromViewOwnProps,
	ViewOwnProps,
} from '@wp-g2/create-styles';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { View } from '../view';

interface Options< P extends ViewOwnProps< {}, any > > {
	as: ElementTypeFromViewOwnProps< P >;
	name: string;
	useHook: ( props: P ) => any;
	memo?: boolean;
}

/**
 * Factory that creates a React component from a hook
 *
 * @param options
 * @param options.as The element to render for the component.
 * @param options.name The name of the component.
 * @param options.useHook The hook to use for the component
 * @param options.memo Whether to memo the component.
 * @return A polymorphic component that uses the hook to process props.
 */
export const createComponent = < P extends ViewOwnProps< {}, any > >( {
	as,
	name = 'Component',
	useHook = identity,
	memo = true,
}: Options< P > ): PolymorphicComponent<
	ElementTypeFromViewOwnProps< P >,
	PropsFromViewOwnProps< P >
> => {
	function Component( props: P, forwardedRef: Ref< any > ) {
		const otherProps = useHook( props );

		return (
			<View as={ as || 'div' } { ...otherProps } ref={ forwardedRef } />
		);
	}

	Component.displayName = name;

	return contextConnect( Component, name, { memo } );
};
