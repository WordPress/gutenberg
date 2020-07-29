/**
 * External dependencies
 */

import { orderBy } from 'lodash';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import {
	__experimentalToolbarItem as ToolbarItem,
	ToolbarGroup,
	DropdownMenu,
	Slot,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

const FormatToolbar = () => {
	return (
		<div className="block-editor-format-toolbar">
			<ToolbarGroup>
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
							<ToolbarItem>
								{ ( toggleProps ) => (
									<DropdownMenu
										icon={ chevronDown }
										label={ __(
											'More rich text controls'
										) }
										toggleProps={ toggleProps }
										controls={ orderBy(
											fills.map(
												( [ { props } ] ) => props
											),
											'title'
										) }
										popoverProps={ POPOVER_PROPS }
									/>
								) }
							</ToolbarItem>
						)
					}
				</Slot>
			</ToolbarGroup>
		</div>
	);
};

export default FormatToolbar;
