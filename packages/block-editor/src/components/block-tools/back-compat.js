/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { Disabled } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import InsertionPoint, { InsertionPointOpenRef } from './insertion-point';
import BlockToolbarPopover from './block-toolbar-popover';

export default function BlockToolsBackCompat( { children } ) {
	const openRef = useContext( InsertionPointOpenRef );
	const isDisabled = useContext( Disabled.Context );

	// If context is set, `BlockTools` is a parent component.
	if ( openRef || isDisabled ) {
		return children;
	}

	deprecated( 'wp.components.Popover.Slot name="block-toolbar"', {
		alternative: 'wp.blockEditor.BlockTools',
		since: '5.8',
		version: '6.3',
	} );

	return (
		<InsertionPoint __unstablePopoverSlot="block-toolbar">
			<BlockToolbarPopover __unstablePopoverSlot="block-toolbar" />
			{ children }
		</InsertionPoint>
	);
}
