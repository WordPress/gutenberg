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
import { ToolbarContext } from '../toolbar';

function AccessibleToolbarButtonContainer( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	const childButton = Children.only( props.children );

	// https://reakit.io/docs/composition/#props-hooks
	const itemHTMLProps = useToolbarItem( accessibleToolbarState, {
		...childButton.props,
		// With this attribute, can check if `ToolbarButton` is used within the
		// tree and then decide whether to use the accessible Toolbar (which only
		// accepts `ToolbarButton` as toolbar items) or fallback to the legacy
		// `NavigableToolbar`, which accepts any tabbable element.
		'data-toolbar-button': true,
	} );

	return <div { ...props }>{ cloneElement( childButton, itemHTMLProps ) }</div>;
}

export default AccessibleToolbarButtonContainer;
