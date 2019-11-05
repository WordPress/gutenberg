/**
 * External dependencies
 */
import classnames from 'classnames';
import { Toolbar } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function ToolbarContainer( { accessibilityLabel, className, ...props }, ref ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return (
		<Toolbar
			ref={ ref }
			aria-label={ accessibilityLabel }
			data-toolbar={ true }
			// `ToolbarGroup` already uses components-toolbar for compatibility reasons
			className={ classnames( 'components-accessible-toolbar', className ) }
			{ ...accessibleToolbarState }
			{ ...props }
		/>
	);
}

export default forwardRef( ToolbarContainer );
