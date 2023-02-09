// @ts-nocheck

/**
 * External dependencies
 */
import { ToolbarItem as BaseToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function ToolbarItem( { children, as: Component, ...props }, ref ) {
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
		return children( allProps );
	}

	return (
		<BaseToolbarItem
			{ ...accessibleToolbarState }
			{ ...allProps }
			as={ Component }
		>
			{ children }
		</BaseToolbarItem>
	);
}

export default forwardRef( ToolbarItem );
