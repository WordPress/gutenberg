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
import type { CompositeItemProps } from './types';

export const CompositeItem = forwardRef<
	HTMLButtonElement,
	WordPressComponentProps< CompositeItemProps, 'button', false >
>( function CompositeItem( props, ref ) {
	const context = useCompositeContext();

	// @ts-expect-error The store prop in undocumented and only used by the
	// legacy compat layer.
	const storeViaProps = props.store as Ariakit.CompositeStore;
	const store = storeViaProps ?? ( context.store as Ariakit.CompositeStore );

	return <Ariakit.CompositeItem store={ store } { ...props } ref={ ref } />;
} );
