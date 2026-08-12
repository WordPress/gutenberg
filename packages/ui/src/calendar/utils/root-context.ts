import { createContext } from '@wordpress/element';
import type { Ref } from 'react';
import type { ComponentProps } from '../../utils/types';

export type RootContextValue = {
	render?: ComponentProps< 'div' >[ 'render' ];
	ref?: Ref< HTMLDivElement >;
};

/**
 * `@daypicker/react` only accepts custom components through its `components`
 * prop, which needs to be referentially stable across renders — a new component
 * type would remount the whole calendar on every render, losing focus.
 *
 * The `Root` override is therefore declared once at module scope, and reads the
 * per-instance `render` and `ref` from this context instead of closing over
 * them.
 */
export const RootContext = createContext< RootContextValue >( {} );
