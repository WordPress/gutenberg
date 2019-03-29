/**
 * WordPress dependencies
 */

import { Toolbar, Slot, createSlotFill } from '@wordpress/components';

const { Slot: ToolbarControlsSlot } = createSlotFill( 'RichText.ToolbarControls' );

const FormatToolbar = ( { controls } ) => {
	return (
		<Toolbar>
			{ controls.map( ( format ) =>
				<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
			) }
			<ToolbarControlsSlot />
		</Toolbar>
	);
};

FormatToolbar.Slot = ToolbarControlsSlot;

export default FormatToolbar;
