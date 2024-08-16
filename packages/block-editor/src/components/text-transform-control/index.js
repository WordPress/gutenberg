/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	reset,
	formatCapitalize,
	formatLowercase,
	formatUppercase,
} from '@wordpress/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';

const TEXT_TRANSFORMS = [
	{
		label: __( 'None' ),
		value: 'none',
		icon: reset,
	},
	{
		label: __( 'Uppercase' ),
		value: 'uppercase',
		icon: formatUppercase,
	},
	{
		label: __( 'Lowercase' ),
		value: 'lowercase',
		icon: formatLowercase,
	},
	{
		label: __( 'Capitalize' ),
		value: 'capitalize',
		icon: formatCapitalize,
	},
];

/**
 * Control to facilitate text transform selections.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.className Class name to add to the control.
 * @param {string}   props.value     Currently selected text transform.
 * @param {Function} props.onChange  Handles change in text transform selection.
 *
 * @return {Element} Text transform control.
 */
export default function TextTransformControl( { className, value, onChange } ) {
	return (
		<ToggleGroupControl
			isDeselectable
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Letter case' ) }
			className={ clsx(
				'block-editor-text-transform-control',
				className
			) }
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === value ? undefined : newValue );
			} }
		>
			{ TEXT_TRANSFORMS.map( ( option ) => {
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
