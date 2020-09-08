/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalToolbarContext as ToolbarContext,
	createSlotFill,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import PopoverWrapper from './popover-wrapper';

const { Fill, Slot } = createSlotFill( 'BlockControlsInlinePopover' );

function BlockToolbarWrapperWithInlinePopoverSlot( { className, children } ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return (
		<Slot fillProps={ accessibleToolbarState }>
			{ ( fills ) => (
				<>
					<div
						className={ classnames( className, {
							'is-hidden': ! isEmpty( fills ),
						} ) }
					>
						{ children }
					</div>
					{ ! isEmpty( fills ) && (
						<PopoverWrapper>{ fills }</PopoverWrapper>
					) }
				</>
			) }
		</Slot>
	);
}

function BlockToolbarInlinePopoverFill( { controls, children } ) {
	return (
		<Fill>
			{ ( fillProps ) => {
				// Children passed to BlockControlsFill will not have access to any
				// React Context whose Provider is part of the BlockControlsSlot tree.
				// So we re-create the Provider in this subtree.
				const value = ! isEmpty( fillProps ) ? fillProps : null;
				return (
					<ToolbarContext.Provider value={ value }>
						<ToolbarGroup controls={ controls } />
						{ children }
					</ToolbarContext.Provider>
				);
			} }
		</Fill>
	);
}

export {
	BlockToolbarInlinePopoverFill,
	BlockToolbarWrapperWithInlinePopoverSlot,
};
