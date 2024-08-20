/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { reset, formatStrikethrough, formatUnderline } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';

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
 * @param {Object}   props           Component props.
 * @param {string}   props.value     Currently selected text decoration.
 * @param {Function} props.onChange  Handles change in text decoration selection.
 * @param {string}   props.className Additional class name to apply.
 *
 * @return {Element} Text decoration control.
 */
export default function TextDecorationControl( {
	value,
	onChange,
	className,
} ) {
	return (
		<ToggleGroupControl
			isDeselectable
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Decoration' ) }
			className={ clsx(
				'block-editor-text-decoration-control',
				className
			) }
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === value ? undefined : newValue );
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
