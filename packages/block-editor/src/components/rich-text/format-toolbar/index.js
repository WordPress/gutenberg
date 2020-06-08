/**
 * External dependencies
 */

import { orderBy } from 'lodash';
import classnames from 'classnames';

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
				{ [ 'bold', 'italic', 'link' ].map( ( format ) => (
					<Slot
						name={ `RichText.ToolbarControls.${ format }` }
						key={ format }
					/>
				) ) }
				<Slot name="RichText.ToolbarControls">
					{ ( fills ) => {
						if ( fills.length === 0 ) {
							return null;
						}

						const allProps = fills.map(
							( [ { props } ] ) => props
						);
						const hasActive = allProps.some(
							( { isActive } ) => isActive
						);

						return (
							<ToolbarItem>
								{ ( toggleProps ) => {
									if ( hasActive ) {
										toggleProps = {
											...toggleProps,
											className: classnames(
												toggleProps.className,
												'is-pressed'
											),
										};
									}

									return (
										<DropdownMenu
											icon={ chevronDown }
											label={ __(
												'More rich text controls'
											) }
											toggleProps={ toggleProps }
											controls={ orderBy(
												allProps,
												'title'
											) }
											popoverProps={ POPOVER_PROPS }
										/>
									);
								} }
							</ToolbarItem>
						);
					} }
				</Slot>
			</ToolbarGroup>
		</div>
	);
};

export default FormatToolbar;
