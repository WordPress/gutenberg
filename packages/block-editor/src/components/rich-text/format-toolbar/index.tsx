import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { ToolbarItem, DropdownMenu, Slot } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import type { ComponentProps } from 'react';
import { orderBy } from '../../../utils/sorting';
import { DROPDOWN_FORMATS, TOOLBAR_FORMATS } from './formats';
import type { ToolbarControlFill } from '../types';

type DropdownMenuControls = ComponentProps< typeof DropdownMenu >[ 'controls' ];

const POPOVER_PROPS: { placement: 'bottom-start' } = {
	placement: 'bottom-start',
};

const FormatToolbar = () => {
	return (
		<>
			{ TOOLBAR_FORMATS.map( ( format ) => (
				<Slot
					name={ `RichText.ToolbarControls.${ format }` }
					key={ format }
				/>
			) ) }
			<Slot name="RichText.ToolbarControls">
				{ ( slotFills ) => {
					// The slot renders the fills of `RichTextToolbarButton`.
					const fills = slotFills as ToolbarControlFill[];
					if ( ! fills.length ) {
						return null;
					}

					const allProps = orderBy(
						fills,
						// The core formats are listed first. The other
						// buttons come last, in the order they were
						// rendered, whether or not they pass a name.
						( [ { props } ]: ToolbarControlFill ) => {
							const index = DROPDOWN_FORMATS.indexOf(
								props.name ?? ''
							);
							return index === -1 ? Infinity : index;
						}
					).map( ( [ { props } ] ) => props );
					const hasActive = allProps.some(
						( { isActive } ) => isActive
					);

					return (
						<ToolbarItem>
							{ ( toggleProps ) => (
								<DropdownMenu
									icon={ chevronDown }
									/* translators: button label text should, if possible, be under 16 characters. */
									label={ __( 'More' ) }
									toggleProps={ {
										...toggleProps,
										className: clsx(
											toggleProps.className,
											{ 'is-pressed': hasActive }
										),
										description: __(
											'Displays more block tools'
										),
									} }
									// The toolbar buttons' props are dropdown options too.
									controls={
										allProps as DropdownMenuControls
									}
									popoverProps={ POPOVER_PROPS }
								/>
							) }
						</ToolbarItem>
					);
				} }
			</Slot>
		</>
	);
};

export default FormatToolbar;
