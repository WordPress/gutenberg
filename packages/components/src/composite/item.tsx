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
	return (
		<Ariakit.CompositeItem
			store={ context.store as Ariakit.CompositeStore }
			{ ...props }
			ref={ ref }
		/>
	);
} );
