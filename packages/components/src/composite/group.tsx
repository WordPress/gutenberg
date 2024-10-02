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
import type { CompositeGroupProps } from './types';

export const CompositeGroup = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeGroupProps, 'div', false >
>( function CompositeGroup( props, ref ) {
	const context = useCompositeContext();
	// @ts-expect-error The store prop in undocumented and only used by the
	// legacy compat layer.
	const storeViaProps = props.store as Ariakit.CompositeStore;
	const store = storeViaProps ?? ( context.store as Ariakit.CompositeStore );

	return <Ariakit.CompositeGroup store={ store } { ...props } ref={ ref } />;
} );
