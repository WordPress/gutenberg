import * as Ariakit from '@ariakit/react';
import { forwardRef } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { CompositeGroupContext, useCompositeContext } from './context';
import type { CompositeGroupProps } from './types';

export const CompositeGroup = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeGroupProps, 'div', false >
>( function CompositeGroup( props, ref ) {
	const context = useCompositeContext();
	const { children, ...restProps } = props;

	// @ts-expect-error The store prop is undocumented and only used by the
	// legacy compat layer. The `store` prop is documented, but its type is
	// obfuscated to discourage its use outside of the component's internals.
	const store = ( props.store ?? context.store ) as Ariakit.CompositeStore;

	return (
		<Ariakit.CompositeGroup store={ store } { ...restProps } ref={ ref }>
			<CompositeGroupContext.Provider value>
				{ children }
			</CompositeGroupContext.Provider>
		</Ariakit.CompositeGroup>
	);
} );
