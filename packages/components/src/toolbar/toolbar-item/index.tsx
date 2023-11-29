/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';
import type { ToolbarItemProps } from './types';

function ToolbarItem(
	{ children, as: Component, ...props }: ToolbarItemProps,
	ref: ForwardedRef< any >
) {
	const accessibleToolbarStore = useContext( ToolbarContext );
	const isRenderProp = typeof children === 'function';

	if ( ! isRenderProp && ! Component ) {
		warning(
			'`ToolbarItem` is a generic headless component. You must pass either a `children` prop as a function or an `as` prop as a component. ' +
				'See https://developer.wordpress.org/block-editor/components/toolbar-item/'
		);
		return null;
	}

	const allProps = { ...props, ref, 'data-toolbar-item': true };

	if ( ! accessibleToolbarStore ) {
		if ( Component ) {
			return <Component { ...allProps }>{ children }</Component>;
		}
		if ( ! isRenderProp ) {
			return null;
		}
		return children( allProps );
	}

	const render = isRenderProp
		? children
		: Component && <Component>{ children }</Component>;

	return (
		<Ariakit.ToolbarItem
			{ ...allProps }
			store={ accessibleToolbarStore }
			render={ render }
		/>
	);
}

export default forwardRef( ToolbarItem );
