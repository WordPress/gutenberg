/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { createSlotFill, ToolbarContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockFormatControls' );

function BlockFormatControlsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState || null } />;
}

function BlockFormatControlsFill( props ) {
	return (
		<Fill { ...props }>
			{ ( fillProps ) => (
				<ToolbarContext.Provider value={ fillProps }>
					{ props.children }
				</ToolbarContext.Provider>
			) }
		</Fill>
	);
}

const BlockFormatControls = ifBlockEditSelected( BlockFormatControlsFill );

BlockFormatControls.Slot = BlockFormatControlsSlot;

export default BlockFormatControls;
