/**
 * External dependencies
 */

import { orderBy } from 'lodash';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import {
	Toolbar,
	Slot,
	DropdownMenu,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

const FormatToolbar = () => {
	const slot = useSlot( 'RichText.ToolbarControls' );
	const hasFills = Boolean( slot.fills && slot.fills.length );
	// This still needs to be fixed.

	return (
		<div className="block-editor-format-toolbar">
			<Toolbar>
				{ [ 'bold', 'italic', 'link', 'text-color' ].map(
					( format ) => (
						<Slot
							name={ `RichText.ToolbarControls.${ format }` }
							key={ format }
							bubblesVirtually
						/>
					)
				) }
				{ hasFills && (
					<DropdownMenu
						icon={ chevronDown }
						label={ __( 'More rich text controls' ) }
						controls={ [] }
						popoverProps={ POPOVER_PROPS }
					/>
				) }
			</Toolbar>
		</div>
	);
};

export default FormatToolbar;
