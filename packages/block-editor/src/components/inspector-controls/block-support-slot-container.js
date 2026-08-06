/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelContext as ToolsPanelContext } from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InheritanceMenuContext } from '../global-styles/inheritance/panel-menu';

export default function BlockSupportSlotContainer( {
	Slot,
	fillProps,
	...props
} ) {
	// Add the toolspanel context provider and value to existing fill props
	const toolsPanelContext = useContext( ToolsPanelContext );
	// Fills render in their own React tree, so the panel's inheritance registry
	// has to be forwarded the same way the `ToolsPanel` context is, or panel
	// items never reach the panel collecting them.
	const inheritanceMenuContext = useContext( InheritanceMenuContext );
	const computedFillProps = useMemo(
		() => ( {
			...( fillProps ?? {} ),
			forwardedContext: [
				...( fillProps?.forwardedContext ?? [] ),
				[ ToolsPanelContext.Provider, { value: toolsPanelContext } ],
				[
					InheritanceMenuContext.Provider,
					{ value: inheritanceMenuContext },
				],
			],
		} ),
		[ toolsPanelContext, inheritanceMenuContext, fillProps ]
	);

	return (
		<Slot { ...props } fillProps={ computedFillProps } bubblesVirtually />
	);
}
