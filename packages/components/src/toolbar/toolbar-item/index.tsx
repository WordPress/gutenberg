/**
 * External dependencies
 */
import { ToolbarItem as BaseToolbarItem } from 'reakit/Toolbar';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { ContextSystemProvider } from '../../ui/context';
import ToolbarContext from '../toolbar-context';
import { CONTEXT_SYSTEM_VALUE } from '../constants';

function ToolbarItem(
	{
		children,
		as: Component,
		...props
	}: React.ComponentPropsWithoutRef< typeof BaseToolbarItem >,
	ref: ForwardedRef< any >
) {
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( typeof children !== 'function' && ! Component ) {
		warning(
			'`ToolbarItem` is a generic headless component. You must pass either a `children` prop as a function or an `as` prop as a component. ' +
				'See https://developer.wordpress.org/block-editor/components/toolbar-item/'
		);
		return null;
	}

	const allProps = { ...props, ref, 'data-toolbar-item': true };

	if ( ! accessibleToolbarState ) {
		if ( Component ) {
			return <Component { ...allProps }>{ children }</Component>;
		}
		if ( typeof children !== 'function' ) {
			return null;
		}
		return children( allProps );
	}

	return (
		<ContextSystemProvider value={ CONTEXT_SYSTEM_VALUE }>
			<BaseToolbarItem
				{ ...accessibleToolbarState }
				{ ...allProps }
				as={ Component }
			>
				{ children }
			</BaseToolbarItem>
		</ContextSystemProvider>
	);
}

export default forwardRef( ToolbarItem );
