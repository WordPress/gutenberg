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
	return (
		<Ariakit.CompositeGroup
			store={ context.store as Ariakit.CompositeStore }
			{ ...props }
			ref={ ref }
		/>
	);
} );
