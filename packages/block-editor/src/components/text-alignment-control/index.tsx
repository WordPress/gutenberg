import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import {
	alignLeft,
	alignCenter,
	alignRight,
	alignJustify,
} from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import type { TextAlignmentControlProps } from './types';

const TEXT_ALIGNMENT_OPTIONS = [
	{
		label: __( 'Align text left' ),
		value: 'left',
		icon: alignLeft,
	},
	{
		label: __( 'Align text center' ),
		value: 'center',
		icon: alignCenter,
	},
	{
		label: __( 'Align text right' ),
		value: 'right',
		icon: alignRight,
	},
	{
		label: __( 'Justify text' ),
		value: 'justify',
		icon: alignJustify,
	},
];

const DEFAULT_OPTIONS = [ 'left', 'center', 'right' ];

/**
 * Control to facilitate text alignment selections.
 *
 * @param props           Component props.
 * @param props.className Class name to add to the control.
 * @param props.value     Currently selected text alignment.
 * @param props.onChange  Handles change in text alignment selection.
 * @param props.options   Array of text alignment options to display.
 *
 * @return Text alignment control.
 */
export default function TextAlignmentControl( {
	className,
	value,
	onChange,
	options = DEFAULT_OPTIONS,
}: TextAlignmentControlProps ) {
	const validOptions = useMemo(
		() =>
			TEXT_ALIGNMENT_OPTIONS.filter( ( option ) =>
				options.includes( option.value )
			),
		[ options ]
	);

	if ( ! validOptions.length ) {
		return null;
	}

	return (
		<ToggleGroupControl
			isDeselectable
			label={ __( 'Text alignment' ) }
			className={ clsx(
				'block-editor-text-alignment-control',
				className
			) }
			value={ value }
			onChange={ ( newValue ) => {
				// The options' values are strings.
				onChange(
					newValue === value
						? undefined
						: ( newValue as string | undefined )
				);
			} }
		>
			{ validOptions.map( ( option ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ option.value }
						value={ option.value }
						icon={ option.icon }
						label={ option.label }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}
