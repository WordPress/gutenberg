/**
 * External dependencies
 */
import { useToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function ToolbarButton( { context, as: Component = 'button', ...props }, ref ) {
	// https://reakit.io/docs/composition/#props-hooks
	const itemHTMLProps = useToolbarItem( context, {
		ref,
		...props,
		// With this attribute, can check if `ToolbarButton` is used within the
		// tree and then decide whether to use the accessible Toolbar (which only
		// accepts `ToolbarButton` as toolbar items) or fallback to the legacy
		// `NavigableToolbar`, which accepts any tabbable element.
		'data-toolbar-button': true,
	} );

	return <Component { ...itemHTMLProps } />;
}

export default forwardRef( ToolbarButton );
