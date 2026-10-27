import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { ToolbarItem, DropdownMenu, Slot } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import type { ComponentProps } from 'react';
import { orderBy } from '../../../utils/sorting';
import type { ToolbarControlFill } from '../types';

type DropdownMenuControls = ComponentProps< typeof DropdownMenu >[ 'controls' ];

const POPOVER_PROPS: { placement: 'bottom-start' } = {
	placement: 'bottom-start',
};

const FormatToolbar = () => {
	return (
		<>
			{ [ 'bold', 'italic', 'link', 'unknown', 'non-breaking-space' ].map(
				( format ) => (
					<Slot
						name={ `RichText.ToolbarControls.${ format }` }
						key={ format }
					/>
				)
			) }
			<Slot name="RichText.ToolbarControls">
				{ ( slotFills ) => {
					// The slot renders the fills of `RichTextToolbarButton`.
					const fills = slotFills as ToolbarControlFill[];
					if ( ! fills.length ) {
						return null;
					}

					const allProps = fills.map( ( [ { props } ] ) => props );
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
									controls={
										// The toolbar buttons' props are dropdown options too.
										orderBy(
											fills.map(
												( [ { props } ] ) => props
											),
											'title'
										) as DropdownMenuControls
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
