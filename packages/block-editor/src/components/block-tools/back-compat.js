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
import BlockPopover from './block-popover';
import blockToolbarSlotFill from '../block-toolbar/slot-fill';

export default function BlockToolsBackCompat( { children } ) {
	const openRef = useContext( InsertionPointOpenRef );
	const isDisabled = useContext( Disabled.Context );

	// If context is set, `BlockTools` is a parent component.
	if ( openRef || isDisabled ) {
		return children;
	}

	deprecated( 'wp.components.Popover.Slot name="block-toolbar"', {
		alternative: 'wp.blockEditor.BlockTools',
	} );

	return (
		<InsertionPoint __unstablePopoverSlotFill={ blockToolbarSlotFill }>
			<BlockPopover __unstablePopoverSlotFill={ blockToolbarSlotFill } />
			{ children }
		</InsertionPoint>
	);
}
