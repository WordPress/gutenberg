/**
 * External dependencies
 */
import { ToolbarItem as BaseToolbarItem } from '@ariakit/react/toolbar';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';
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
	const [ rendered, setRendered ] = useState( false );

	useEffect( () => {
		setRendered( true );
	}, [] );

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

	return (
		<BaseToolbarItem
			{ ...allProps }
			store={ accessibleToolbarStore }
			render={ ( itemProps ) => {
				if ( ! rendered ) {
					itemProps = { ...itemProps, tabIndex: 0 };
				}
				if ( isRenderProp ) {
					return children( itemProps );
				}
				if ( Component ) {
					return <Component { ...itemProps } />;
				}
				return <button { ...itemProps } />;
			} }
		/>
	);
}

export default forwardRef( ToolbarItem );
