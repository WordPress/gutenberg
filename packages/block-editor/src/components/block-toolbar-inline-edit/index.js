/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext, useEffect } from '@wordpress/element';
import {
	__experimentalToolbarContext as ToolbarContext,
	createSlotFill,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import PopoverWrapper from './popover-wrapper';

const { Fill, Slot } = createSlotFill( 'BlockControlsInlinePopover' );
import {
	useBlockToolbarInlineEditContext,
	BlockToolbarInlineEditProvider,
} from './context';

function BlockToolbarInlineEditSlotContextHandler( { fills } ) {
	const { setIsEditingInline } = useBlockToolbarInlineEditContext();
	useEffect( () => {
		if ( isEmpty( fills ) ) {
			setIsEditingInline( false );
		} else {
			setIsEditingInline( true );
		}

		return () => setIsEditingInline( false );
	}, [ fills ] );

	return fills;
}

function BlockToolbarInlineEditSlot() {
	const accessibleToolbarState = useContext( ToolbarContext );
	return (
		<Slot fillProps={ accessibleToolbarState }>
			{ ( fills ) => (
				<BlockToolbarInlineEditSlotContextHandler fills={ fills } />
			) }
		</Slot>
	);
}

function BlockToolbarInlineEditFill( { onClose, children } ) {
	return (
		<Fill>
			{ ( fillProps ) => {
				// Children passed to BlockControlsFill will not have access to any
				// React Context whose Provider is part of the BlockControlsSlot tree.
				// So we re-create the Provider in this subtree.
				const value = ! isEmpty( fillProps ) ? fillProps : null;
				return (
					<PopoverWrapper
						className="block-editor-block-toolbar-inline-edit-popover"
						onClose={ onClose }
					>
						<ToolbarContext.Provider value={ value }>
							<div className="block-editor-block-toolbar-inline-edit-popover__toolbar-wrapper">
								{ children }
							</div>
						</ToolbarContext.Provider>
					</PopoverWrapper>
				);
			} }
		</Fill>
	);
}

const BlockToolbarInlineEdit = {
	Slot: BlockToolbarInlineEditSlot,
	Fill: BlockToolbarInlineEditFill,
	Provider: BlockToolbarInlineEditProvider,
};

export default BlockToolbarInlineEdit;
export { useBlockToolbarInlineEditContext };
