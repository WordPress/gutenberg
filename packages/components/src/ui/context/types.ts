/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type {
	ForwardRefExoticComponent,
	ElementType,
	PropsWithoutRef,
	RefAttributes,
	MemoExoticComponent,
} from 'react';

type ForwardedRefComponent<
	T extends ElementType,
	P
> = ForwardRefExoticComponent< PropsWithoutRef< P > & RefAttributes< T > >;

export type MaybeMemoizedForwardedRefComponent< T extends ElementType, P > =
	| MemoExoticComponent< ForwardedRefComponent< T, P > >
	| ForwardedRefComponent< T, P >;
