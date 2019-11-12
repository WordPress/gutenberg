/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { createSlotFill, __experimentalToolbarContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockFormatControls' );

function BlockFormatControlsSlot( props ) {
	const accessibleToolbarState = useContext( __experimentalToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState || null } />;
}

function BlockFormatControlsFill( props ) {
	return (
		<Fill { ...props }>
			{ ( fillProps ) => (
				<__experimentalToolbarContext.Provider value={ fillProps }>
					{ props.children }
				</__experimentalToolbarContext.Provider>
			) }
		</Fill>
	);
}

const BlockFormatControls = ifBlockEditSelected( BlockFormatControlsFill );

BlockFormatControls.Slot = BlockFormatControlsSlot;

export default BlockFormatControls;
