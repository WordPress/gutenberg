/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PopoverWrapper from './popover-wrapper';

const { Fill, Slot } = createSlotFill( 'BlockToolbarInlineEdit' );

function BlockToolbarInlineEditStateHandler( { fills } ) {
	const { setIsEditingInToolbar } = useDispatch( 'core/block-editor' );
	useEffect( () => {
		if ( isEmpty( fills ) ) {
			setIsEditingInToolbar( false );
		} else {
			setIsEditingInToolbar( true );
		}

		return () => setIsEditingInToolbar( false );
	}, [ fills ] );

	return fills;
}

function BlockToolbarInlineEdit( { onClose, children } ) {
	return (
		<Fill>
			<PopoverWrapper
				className="block-editor-block-toolbar-inline-edit-popover"
				onClose={ onClose }
			>
				<div className="block-editor-block-toolbar-inline-edit-popover__toolbar-wrapper">
					{ children }
				</div>
			</PopoverWrapper>
		</Fill>
	);
}

function BlockToolbarInlineEditSlot() {
	return (
		<Slot>
			{ ( fills ) => (
				<BlockToolbarInlineEditStateHandler fills={ fills } />
			) }
		</Slot>
	);
}

BlockToolbarInlineEdit.Slot = BlockToolbarInlineEditSlot;

export default BlockToolbarInlineEdit;
