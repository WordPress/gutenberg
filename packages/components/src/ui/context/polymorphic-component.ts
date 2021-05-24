/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as React from 'react';
import type { As, RenderProp, ExtractHTMLAttributes } from 'reakit-utils/types';
import type { Interpolation } from 'create-emotion';

/**
 * Based on https://github.com/reakit/reakit/blob/master/packages/reakit-utils/src/types.ts
 */
export type PolymorphicComponentProps< P, T extends As > = P &
	Omit< React.ComponentPropsWithRef< T >, 'as' | keyof P > & {
		as?: T | keyof JSX.IntrinsicElements;
		children?: React.ReactNode | RenderProp< ExtractHTMLAttributes< any > >;
	};

export type ElementTypeFromPolymorphicComponentProps<
	P
> = P extends PolymorphicComponentProps< unknown, infer T > ? T : never;

export type PropsFromPolymorphicComponentProps<
	P
> = P extends PolymorphicComponentProps< infer PP, any > ? PP : never;

export type PolymorphicComponent< T extends As, O > = {
	< TT extends As >(
		props: PolymorphicComponentProps< O, TT > & { as: TT }
	): JSX.Element | null;
	( props: PolymorphicComponentProps< O, T > ): JSX.Element | null;
	displayName?: string;
	/**
	 * A CSS selector used to fake component interpolation in styled components
	 * for components not generated by `styled`. Anything passed to `contextConnect`
	 * will get this property.
	 *
	 * We restrict it to a class to align with the already existing class names that
	 * are generated by the context system.
	 */
	selector: `.${ string }`;
};

export type CreatePolymorphicComponent< T extends As, P > = (
	template: TemplateStringsArray,
	...styles: (
		| Interpolation< undefined >
		| PolymorphicComponent< any, any >
	 )[]
) => PolymorphicComponent< T, P >;

export type ForwardedRef< TElement extends HTMLElement > =
	| ( ( instance: TElement | null ) => void )
	| React.MutableRefObject< TElement | null >
	| null;

export type CoreElements = {
	[ P in keyof JSX.IntrinsicElements ]: PolymorphicComponent< P, {} >;
};

type CreateStyledComponents = {
	[ P in keyof JSX.IntrinsicElements ]: CreatePolymorphicComponent< P, {} >;
};

export type CreateStyled = CreateStyledComponents & {
	< T extends As >( component: T ): CreatePolymorphicComponent< T, {} >;
};
