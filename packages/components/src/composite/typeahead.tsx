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
	return (
		<Ariakit.CompositeTypeahead
			store={ context.store as Ariakit.CompositeStore }
			{ ...props }
			ref={ ref }
		/>
	);
} );
