import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { ToolbarItem, DropdownMenu, Slot } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import type { ComponentProps } from 'react';
import type { ToolbarControlFill } from '../types';

type DropdownMenuControls = ComponentProps< typeof DropdownMenu >[ 'controls' ];

const POPOVER_PROPS: { placement: 'bottom-start' } = {
	placement: 'bottom-start',
};

const TOOLBAR_FORMATS = [
	'bold',
	'italic',
	'link',
	'unknown',
	'non-breaking-space',
];

const DROPDOWN_FORMATS = [
	'text-color',
	'image',
	'code',
	'keyboard',
	'strikethrough',
	'superscript',
	'subscript',
	'language',
	'math',
	'footnote',
];

const MoreFormatsDropdown = ( { fills }: { fills: ToolbarControlFill[] } ) => {
	if ( ! fills.length ) {
		return null;
	}

	const allProps = fills.map( ( [ { props } ] ) => props );
	const hasActive = allProps.some( ( { isActive } ) => isActive );

	return (
		<ToolbarItem>
			{ ( toggleProps ) => (
				<DropdownMenu
					icon={ chevronDown }
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
};

// Nests a slot for each format in `DROPDOWN_FORMATS`, so that their fills can
// be collected in order into a single dropdown. The fills of buttons without a
// `name` come last, in the order they were rendered.
const DropdownSlots = ( {
	index = 0,
	collected = [],
}: {
	index?: number;
	collected?: ToolbarControlFill[];
} ) => {
	if ( index === DROPDOWN_FORMATS.length ) {
		return (
			<Slot name="RichText.ToolbarControls">
				{ ( fills ) => (
					<MoreFormatsDropdown
						fills={ [
							...collected,
							...( fills as ToolbarControlFill[] ),
						] }
					/>
				) }
			</Slot>
		);
	}

	return (
		<Slot
			name={ `RichText.ToolbarControls.${ DROPDOWN_FORMATS[ index ] }` }
		>
			{ ( fills ) => (
				<DropdownSlots
					index={ index + 1 }
					collected={ [
						...collected,
						...( fills as ToolbarControlFill[] ),
					] }
				/>
			) }
		</Slot>
	);
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
			<DropdownSlots />
		</>
	);
};

export default FormatToolbar;
