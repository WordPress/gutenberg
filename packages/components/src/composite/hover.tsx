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
import type { CompositeHoverProps } from './types';

export const CompositeHover = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeHoverProps, 'div', false >
>( function CompositeHover( props, ref ) {
	const context = useCompositeContext();
	return (
		<Ariakit.CompositeHover
			store={ context.store as Ariakit.CompositeStore }
			{ ...props }
			ref={ ref }
		/>
	);
} );
