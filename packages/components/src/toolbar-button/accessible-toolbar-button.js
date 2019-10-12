/**
 * External dependencies
 */
import { useToolbarItem } from 'reakit/Toolbar';

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
	const children = Children.only( props.children );
	const itemProps = useToolbarItem( toolbar, children.props );
	return cloneElement( children, itemProps );
}

export default AccessibleToolbarButton;
