/**
 * External dependencies
 */
import { ToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { useContext, Children, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function AccessibleToolbarButton( props ) {
	const toolbar = useContext( ToolbarContext );
	return (
		<ToolbarItem { ...toolbar }>
			{ ( htmlProps ) => cloneElement( Children.only( props.children ), htmlProps ) }
		</ToolbarItem>
	);
}

export default AccessibleToolbarButton;
