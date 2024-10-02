/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { useCompositeContext } from './context';
import type { CompositeGroupLabelProps } from './types';

export const CompositeGroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeGroupLabelProps, 'div', false >
>( function CompositeGroupLabel( props, ref ) {
	const context = useCompositeContext();
	// @ts-expect-error The store prop in undocumented and only used by the
	// legacy compat layer.
	const store = ( props.store ?? context.store ) as Ariakit.CompositeStore;

	return (
		<Ariakit.CompositeGroupLabel store={ store } { ...props } ref={ ref } />
	);
} );
