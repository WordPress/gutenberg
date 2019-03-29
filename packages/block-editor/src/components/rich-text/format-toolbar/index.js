/**
 * External dependencies
 */

import { orderBy } from 'lodash';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { Toolbar, Slot, DropdownMenu, createSlotFill } from '@wordpress/components';

const { Slot: ToolbarControlsSlot } = createSlotFill( 'RichText.ToolbarControls' );

const FormatToolbar = ( { controls } ) => {
	return (
		<div className="editor-format-toolbar block-editor-format-toolbar">
			<Toolbar>
				{ controls.map( ( format ) =>
					<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
				) }
				<ToolbarControlsSlot>
					{ ( fills ) => fills.length !== 0 &&
						<DropdownMenu
							icon={ false }
							position="bottom left"
							label={ __( 'More Rich Text Controls' ) }
							controls={ orderBy( fills.map( ( [ { props } ] ) => props ), 'title' ) }
						/>
					}
				</ToolbarControlsSlot>
			</Toolbar>
		</div>
	);
};

FormatToolbar.Slot = ToolbarControlsSlot;

export default FormatToolbar;
