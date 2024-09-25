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
	return (
		<Ariakit.CompositeRow
			store={ context.store as Ariakit.CompositeStore }
			{ ...props }
			ref={ ref }
		/>
	);
} );
