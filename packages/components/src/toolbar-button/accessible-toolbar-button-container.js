/**
 * External dependencies
 */
import { useToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { Children, cloneElement, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function AccessibleToolbarButtonContainer( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	const childButton = Children.only( props.children );

	// https://reakit.io/docs/composition/#props-hooks
	const itemHTMLProps = useToolbarItem( accessibleToolbarState, childButton.props );

	return <div { ...props }>{ cloneElement( childButton, itemHTMLProps ) }</div>;
}

export default AccessibleToolbarButtonContainer;
