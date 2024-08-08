/**
 * External dependencies
 */
import type * as Ariakit from '@ariakit/react';

export type CompositeStoreProps = Pick<
	Ariakit.CompositeStoreProps,
	| 'activeId'
	| 'defaultActiveId'
	| 'setActiveId'
	| 'focusLoop'
	| 'focusShift'
	| 'focusWrap'
	| 'virtualFocus'
	| 'orientation'
	| 'rtl'
>;

export type CompositeProps = Pick<
	Ariakit.CompositeProps,
	'render' | 'children'
> & {
	/**
	 * Object returned by the `useCompositeStore` hook
	 */
	store?: Ariakit.CompositeProps[ 'store' ];
};

export type CompositeGroupProps = Pick<
	Ariakit.CompositeGroupProps,
	'render' | 'children'
>;

export type CompositeGroupLabelProps = Pick<
	Ariakit.CompositeGroupLabelProps,
	'render' | 'children'
>;

export type CompositeItemProps = Pick<
	Ariakit.CompositeItemProps,
	'render' | 'children'
>;

export type CompositeRowProps = Pick<
	Ariakit.CompositeRowProps,
	'render' | 'children'
>;
