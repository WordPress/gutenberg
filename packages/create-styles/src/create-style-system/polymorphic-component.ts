import * as React from 'react';
import { As, RenderProp, ExtractHTMLAttributes } from 'reakit-utils/types';
import { Interpolation, ObjectInterpolation } from 'create-emotion';

/**
 * Based on https://github.com/reakit/reakit/blob/master/packages/reakit-utils/src/types.ts
 */
export type ViewOwnProps<P, T extends As> = P &
	Omit<React.ComponentPropsWithRef<T>, 'as' | 'css' | keyof P> & {
		as?: T | keyof JSX.IntrinsicElements;
		children?: React.ReactNode | RenderProp<ExtractHTMLAttributes<any>>;
		css?: ObjectInterpolation<undefined> | string;
	};

export type ElementTypeFromViewOwnProps<P> = P extends ViewOwnProps<
	unknown,
	infer T
>
	? T
	: never;

export type PropsFromViewOwnProps<P> = P extends ViewOwnProps<infer PP, any>
	? PP
	: never;

export type PolymorphicComponent<T extends As, O> = {
	<TT extends As>(
		props: ViewOwnProps<O, TT> & { as: TT },
	): JSX.Element | null;
	(props: ViewOwnProps<O, T>): JSX.Element | null;
	displayName?: string;
};

export type CreatePolymorphicComponent<T extends As, P> = (
	template: TemplateStringsArray,
	...styles: Interpolation<undefined>[]
) => PolymorphicComponent<T, P>;

export type ForwardedRef<TElement extends HTMLElement> =
	| ((instance: TElement | null) => void)
	| React.MutableRefObject<TElement | null>
	| null;

export type CoreElements = {
	[P in keyof JSX.IntrinsicElements]: PolymorphicComponent<P, {}>;
};

type CreateStyledComponents = {
	[P in keyof JSX.IntrinsicElements]: CreatePolymorphicComponent<P, {}>;
};

export type CreateStyled = CreateStyledComponents & {
	<T extends As>(component: T): CreatePolymorphicComponent<T, {}>;
};
