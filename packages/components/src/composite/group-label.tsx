import * as Ariakit from '@ariakit/react';
import { forwardRef } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { useCompositeContext, useCompositeGroupContext } from './context';
import type { CompositeGroupLabelProps } from './types';

export const CompositeGroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeGroupLabelProps, 'div', false >
>( function CompositeGroupLabel( props, ref ) {
	const context = useCompositeContext();
	const isWithinGroup = useCompositeGroupContext();

	if ( ! isWithinGroup ) {
		throw new Error(
			'Composite.GroupLabel can only be rendered inside Composite.Group.'
		);
	}

	// @ts-expect-error The store prop is undocumented and only used by the
	// legacy compat layer. The `store` prop is documented, but its type is
	// obfuscated to discourage its use outside of the component's internals.
	const store = ( props.store ?? context.store ) as Ariakit.CompositeStore;

	return (
		<Ariakit.CompositeGroupLabel store={ store } { ...props } ref={ ref } />
	);
} );
