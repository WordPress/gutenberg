/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelContext as ToolsPanelContext } from '@wordpress/components';
import { useContext } from '@wordpress/element';

export default function BlockSupportSlotContainer( { Slot, ...props } ) {
	const toolsPanelContext = useContext( ToolsPanelContext );
	return (
		<Slot { ...props } fillProps={ toolsPanelContext } bubblesVirtually />
	);
}
