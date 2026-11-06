import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import {
	ToolbarGroup,
	ToolbarItem,
	DropdownMenu,
	Slot,
} from '@wordpress/components';
import { chevronDown, moreVertical } from '@wordpress/icons';
import type { ComponentProps, ReactNode } from 'react';
import { orderBy } from '../../../utils/sorting';
import { DROPDOWN_FORMATS, TOOLBAR_FORMATS } from './formats';
import type { ToolbarControlFill } from '../types';

type DropdownMenuControls = ComponentProps< typeof DropdownMenu >[ 'controls' ];

const POPOVER_PROPS: { placement: 'bottom-start' } = {
	placement: 'bottom-start',
};

/**
 * Formats that insert content rather than format text. The redesigned block
 * toolbar offers them in the Insert submenu of the block options menu.
 */
export const INSERT_FORMAT_NAMES = [ 'image', 'footnote', 'math' ];

/**
 * Renders the fills of several rich text toolbar slots as one list.
 *
 * Each slot only renders its fills where it is registered, so a slot name
 * rendered here must not be rendered anywhere else at the same time.
 *
 * @param props          Component props.
 * @param props.names    The slot names, in order.
 * @param props.children Renders the fills of all the slots.
 */
export function RichTextToolbarControlsFills( {
	names,
	children,
}: {
	names: string[];
	children: ( fills: ToolbarControlFill[] ) => ReactNode;
} ) {
	const [ name, ...rest ] = names;
	if ( ! name ) {
		return <>{ children( [] ) }</>;
	}
	return (
		<Slot name={ name }>
			{ ( slotFills ) => (
				<RichTextToolbarControlsFills names={ rest }>
					{ ( restFills ) =>
						children( [
							// The slot renders the fills of `RichTextToolbarButton`.
							...( slotFills as ToolbarControlFill[] ),
							...restFills,
						] )
					}
				</RichTextToolbarControlsFills>
			) }
		</Slot>
	);
}

/**
 * Orders the fills of the "More" dropdown: the core formats first, then the
 * other buttons, in the order they were rendered, whether or not they pass a
 * name.
 *
 * @param fills The fills.
 * @return The ordered fills.
 */
function orderMoreFills( fills: ToolbarControlFill[] ) {
	return orderBy( fills, ( [ { props } ]: ToolbarControlFill ) => {
		const index = DROPDOWN_FORMATS.indexOf( props.name ?? '' );
		return index === -1 ? Infinity : index;
	} );
}

function MoreFormatsDropdown( {
	fills,
	icon,
}: {
	fills: ToolbarControlFill[];
	icon: ComponentProps< typeof DropdownMenu >[ 'icon' ];
} ) {
	if ( ! fills.length ) {
		return null;
	}

	const allProps = orderMoreFills( fills ).map( ( [ { props } ] ) => props );
	const hasActive = allProps.some( ( { isActive } ) => isActive );

	return (
		<ToolbarItem>
			{ ( toggleProps ) => (
				<DropdownMenu
					icon={ icon }
					/* translators: button label text should, if possible, be under 16 characters. */
					label={ __( 'More' ) }
					toggleProps={ {
						...toggleProps,
						className: clsx( toggleProps.className, {
							'is-pressed': hasActive,
						} ),
						description: __( 'Displays more block tools' ),
					} }
					// The toolbar buttons' props are dropdown options too.
					controls={ allProps as DropdownMenuControls }
					popoverProps={ POPOVER_PROPS }
				/>
			) }
		</ToolbarItem>
	);
}

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
				{ ( fills ) => (
					<MoreFormatsDropdown
						// The slot renders the fills of `RichTextToolbarButton`.
						fills={ fills as ToolbarControlFill[] }
						icon={ chevronDown }
					/>
				) }
			</Slot>
		</>
	);
};

/**
 * The format toolbar shown with a text selection when the block toolbar
 * redesign experiment is enabled. Highlight gets a button of its own, and
 * inserting formats are left out: the block options menu offers them.
 */
export const SelectionFormatToolbar = () => {
	const formatSlot = ( format: string ) => (
		<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
	);
	return (
		<Slot name="RichText.ToolbarControls">
			{ ( slotFills ) => {
				// The slot renders the fills of `RichTextToolbarButton`.
				const fills = slotFills as ToolbarControlFill[];
				const highlight = fills.filter(
					( [ { props } ] ) => props.name === 'text-color'
				);
				const more = fills.filter(
					( [ { props } ] ) =>
						props.name !== 'text-color' &&
						! INSERT_FORMAT_NAMES.includes( props.name ?? '' )
				);
				return (
					<>
						<ToolbarGroup>
							{ [ 'bold', 'italic', 'link' ].map( formatSlot ) }
							{ highlight }
							{ TOOLBAR_FORMATS.filter(
								( format ) =>
									! [ 'bold', 'italic', 'link' ].includes(
										format
									)
							).map( formatSlot ) }
						</ToolbarGroup>
						{ more.length > 0 && (
							<ToolbarGroup>
								<MoreFormatsDropdown
									fills={ more }
									icon={ moreVertical }
								/>
							</ToolbarGroup>
						) }
					</>
				);
			} }
		</Slot>
	);
};

export default FormatToolbar;
