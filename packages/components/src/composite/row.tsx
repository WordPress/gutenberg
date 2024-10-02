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
import type { CompositeRowProps } from './types';

export const CompositeRow = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeRowProps, 'div', false >
>( function CompositeRow( props, ref ) {
	const context = useCompositeContext();

	// @ts-expect-error The store prop in undocumented and only used by the
	// legacy compat layer.
	const storeViaProps = props.store as Ariakit.CompositeStore;
	const store = storeViaProps ?? ( context.store as Ariakit.CompositeStore );

	return <Ariakit.CompositeRow store={ store } { ...props } ref={ ref } />;
} );
