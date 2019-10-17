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

function AccessibleToolbarButtonContainer( props ) {
	const toolbar = useContext( ToolbarContext );
	const button = Children.only( props.children );
	const itemHTMLProps = useToolbarItem( toolbar, button.props );
	return (
		<div { ...props }>
			{ cloneElement( button, itemHTMLProps ) }
		</div>
	);
}

export default AccessibleToolbarButtonContainer;
