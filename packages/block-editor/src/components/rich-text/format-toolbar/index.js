/**
 * External dependencies
 */

import { orderBy } from 'lodash';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { ToolbarItem, DropdownMenu, Slot } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

const FormatToolbar = () => {
	return (
		<>
			{ [ 'bold', 'italic', 'link', 'text-color' ].map( ( format ) => (
				<Slot
					name={ `RichText.ToolbarControls.${ format }` }
					key={ format }
				/>
			) ) }
			<Slot name="RichText.ToolbarControls">
				{ ( fills ) =>
					fills.length !== 0 && (
						<ToolbarItem>
							{ ( toggleProps ) => (
								<DropdownMenu
									icon={ chevronDown }
									/* translators: button label text should, if possible, be under 16 characters. */
									label={ __( 'More' ) }
									toggleProps={ toggleProps }
									controls={ orderBy(
										fills.map( ( [ { props } ] ) => props ),
										'title'
									) }
									popoverProps={ POPOVER_PROPS }
								/>
							) }
						</ToolbarItem>
					)
				}
			</Slot>
		</>
	);
};

export default FormatToolbar;
