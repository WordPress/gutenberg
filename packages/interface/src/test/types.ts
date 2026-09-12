import type { ComponentProps, MouseEvent } from 'react';
import type { CurriedSelectorsOf } from '@wordpress/data';
import { describe, it } from 'vitest';
import type { ActionItem, store } from '..';

/**
 * Resolves to `true` only when `A` and `B` are mutually assignable, so a
 * widened type such as `any` fails `true satisfies Expect< A, B >`.
 */
type Expect< A, B > = 0 extends 1 & A
	? never
	: [ A ] extends [ B ]
	? [ B ] extends [ A ]
		? true
		: never
	: never;

type Selectors = CurriedSelectorsOf< typeof store >;
type ActionItemOnClick = ComponentProps< typeof ActionItem >[ 'onClick' ];
type FillPropsOnClick = NonNullable<
	ComponentProps< typeof ActionItem.Slot >[ 'fillProps' ]
>[ 'onClick' ];

describe( 'Interface types', () => {
	// eslint-disable-next-line jest/expect-expect -- compile-time assertions only.
	it( 'types the selector return values', () => {
		true satisfies Expect<
			ReturnType< Selectors[ 'isComplementaryAreaLoading' ] >,
			boolean | undefined
		>;
		true satisfies Expect<
			ReturnType< Selectors[ 'isItemPinned' ] >,
			boolean
		>;
	} );

	// eslint-disable-next-line jest/expect-expect -- compile-time assertions only.
	it( 'accepts typed and inline click handlers', () => {
		const onButtonClick = ( event: MouseEvent< HTMLButtonElement > ) =>
			event.currentTarget;

		onButtonClick satisfies ActionItemOnClick;
		onButtonClick satisfies FillPropsOnClick;
		( ( event ) => event.currentTarget ) satisfies ActionItemOnClick;
		( ( event ) => event.currentTarget ) satisfies FillPropsOnClick;
	} );
} );
