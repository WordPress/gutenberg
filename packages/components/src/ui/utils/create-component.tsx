/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
import type { As } from 'reakit-utils/types';

/**
 * Internal dependencies
 */
import { contextConnect } from '../context';
// eslint-disable-next-line no-duplicate-imports
import type {
	PolymorphicComponent,
	PropsFromPolymorphicComponentProps,
	ElementTypeFromPolymorphicComponentProps,
	PolymorphicComponentProps,
} from '../context';
import { View } from '../../view';

interface Options<
	A extends As,
	P extends PolymorphicComponentProps< {}, A >
> {
	as: A;
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
export const createComponent = <
	A extends As,
	P extends PolymorphicComponentProps< {}, A >
>( {
	as,
	name,
	useHook,
	memo = false,
}: Options< A, P > ): PolymorphicComponent<
	ElementTypeFromPolymorphicComponentProps< P >,
	PropsFromPolymorphicComponentProps< P >
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
