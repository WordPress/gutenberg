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
import type { CompositeTypeaheadProps } from './types';

export const CompositeTypeahead = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeTypeaheadProps, 'div', false >
>( function CompositeTypeahead( props, ref ) {
	const context = useCompositeContext();

	// @ts-expect-error The store prop in undocumented and only used by the
	// legacy compat layer.
	const store = ( props.store ?? context.store ) as Ariakit.CompositeStore;

	return <Ariakit.CompositeRow store={ store } { ...props } ref={ ref } />;
} );
