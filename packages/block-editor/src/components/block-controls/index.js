/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	createSlotFill,
	__experimentalToolbarContext as ToolbarContext,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockControls' );

function BlockControlsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return (
		<Slot
			{ ...props }
			bubblesVirtually
			fillProps={ accessibleToolbarState }
		/>
	);
}

function BlockControlsFill( { controls, children } ) {
	return (
		<Fill>
			{ ( fillProps ) => (
				<ToolbarContext.Provider
					value={ Object.keys( fillProps ).length ? fillProps : null }
				>
					<ToolbarGroup controls={ controls } />
					{ children }
				</ToolbarContext.Provider>
			) }
		</Fill>
	);
}

const BlockControls = ifBlockEditSelected( BlockControlsFill );

BlockControls.Slot = BlockControlsSlot;

export default BlockControls;
