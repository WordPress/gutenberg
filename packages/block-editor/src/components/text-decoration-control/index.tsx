import clsx from 'clsx';
import { reset, formatStrikethrough, formatUnderline } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import type { TextDecorationControlProps } from './types';

const TEXT_DECORATIONS = [
	{
		label: __( 'None' ),
		value: 'none',
		icon: reset,
	},
	{
		label: __( 'Underline' ),
		value: 'underline',
		icon: formatUnderline,
	},
	{
		label: __( 'Strikethrough' ),
		value: 'line-through',
		icon: formatStrikethrough,
	},
];

/**
 * Control to facilitate text decoration selections.
 *
 * @param props           Component props.
 * @param props.value     Currently selected text decoration.
 * @param props.onChange  Handles change in text decoration selection.
 * @param props.className Additional class name to apply.
 *
 * @return Text decoration control.
 */
export default function TextDecorationControl( {
	value,
	onChange,
	className,
}: TextDecorationControlProps ) {
	return (
		<ToggleGroupControl
			isDeselectable
			label={ __( 'Decoration' ) }
			className={ clsx(
				'block-editor-text-decoration-control',
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
			{ TEXT_DECORATIONS.map( ( option ) => {
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
