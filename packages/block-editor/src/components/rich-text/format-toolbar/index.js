/**
 * External dependencies
 */

import { orderBy } from 'lodash';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { Toolbar, Slot, DropdownMenu } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

const FormatToolbar = () => {
	return (
		<div className="block-editor-format-toolbar">
			<Toolbar>
				{ [ 'bold', 'italic', 'link', 'text-color' ].map(
					( format ) => (
						<Slot
							name={ `RichText.ToolbarControls.${ format }` }
							key={ format }
						/>
					)
				) }
				<Slot name="RichText.ToolbarControls">
					{ ( fills ) =>
						fills.length !== 0 && (
							<DropdownMenu
								icon={ chevronDown }
								label={ __( 'More rich text controls' ) }
								controls={ orderBy(
									fills.map( ( [ { props } ] ) => props ),
									'title'
								) }
								popoverProps={ POPOVER_PROPS }
							/>
						)
					}
				</Slot>
			</Toolbar>
		</div>
	);
};

export default FormatToolbar;
