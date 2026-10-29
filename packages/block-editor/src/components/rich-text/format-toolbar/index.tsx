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
import type { ToolbarControlFill } from '../types';

type DropdownMenuControls = ComponentProps< typeof DropdownMenu >[ 'controls' ];

const POPOVER_PROPS: { placement: 'bottom-start' } = {
	placement: 'bottom-start',
};

/**
 * Formats that insert content rather than format text. The redesigned block
 * toolbar offers them in the Insert submenu of the block options menu, so they
 * fill named slots instead of the generic one.
 */
export const INSERT_FORMAT_NAMES = [ 'image', 'footnote', 'math' ];

/**
 * The fill names that make up the "More" menu of the format toolbar.
 */
const MORE_FILL_NAMES = [
	'RichText.ToolbarControls',
	'RichText.ToolbarControls.text-color',
	...INSERT_FORMAT_NAMES.map(
		( name ) => `RichText.ToolbarControls.${ name }`
	),
];

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

	const allProps = fills.map( ( [ { props } ] ) => props );
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
					controls={
						// The toolbar buttons' props are dropdown options too.
						orderBy( allProps, 'title' ) as DropdownMenuControls
					}
					popoverProps={ POPOVER_PROPS }
				/>
			) }
		</ToolbarItem>
	);
}

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
			<RichTextToolbarControlsFills names={ MORE_FILL_NAMES }>
				{ ( fills ) => (
					<MoreFormatsDropdown fills={ fills } icon={ chevronDown } />
				) }
			</RichTextToolbarControlsFills>
		</>
	);
};

/**
 * The format toolbar shown with a text selection when the block toolbar
 * redesign experiment is enabled. Inserting formats are left out: the block
 * options menu offers them.
 */
export const SelectionFormatToolbar = () => {
	return (
		<>
			<ToolbarGroup>
				{ [
					'bold',
					'italic',
					'link',
					'text-color',
					'unknown',
					'non-breaking-space',
				].map( ( format ) => (
					<Slot
						name={ `RichText.ToolbarControls.${ format }` }
						key={ format }
					/>
				) ) }
			</ToolbarGroup>
			<Slot name="RichText.ToolbarControls">
				{ ( fills ) =>
					( fills as ToolbarControlFill[] ).length > 0 && (
						<ToolbarGroup>
							<MoreFormatsDropdown
								// The slot renders the fills of `RichTextToolbarButton`.
								fills={ fills as ToolbarControlFill[] }
								icon={ moreVertical }
							/>
						</ToolbarGroup>
					)
				}
			</Slot>
		</>
	);
};

export default FormatToolbar;
