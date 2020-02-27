/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	createSlotFill,
	__experimentalToolbarContext as ToolbarContext,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockFormatControls' );

function BlockFormatControlsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return (
		<Slot
			{ ...props }
			bubblesVirtually
			fillProps={ accessibleToolbarState }
		/>
	);
}

function BlockFormatControlsFill( props ) {
	return (
		<Fill { ...props }>
			{ ( fillProps ) => (
				<ToolbarContext.Provider
					value={ Object.keys( fillProps ).length ? fillProps : null }
				>
					{ props.children }
				</ToolbarContext.Provider>
			) }
		</Fill>
	);
}

const BlockFormatControls = ifBlockEditSelected( BlockFormatControlsFill );

BlockFormatControls.Slot = BlockFormatControlsSlot;

export default BlockFormatControls;
