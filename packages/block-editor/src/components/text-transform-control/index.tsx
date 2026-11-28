import clsx from 'clsx';
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
import type { TextTransformControlProps } from './types';

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
 * @param props           Component props.
 * @param props.className Class name to add to the control.
 * @param props.value     Currently selected text transform.
 * @param props.onChange  Handles change in text transform selection.
 *
 * @return Text transform control.
 */
export default function TextTransformControl( {
	className,
	value,
	onChange,
}: TextTransformControlProps ) {
	return (
		<ToggleGroupControl
			isDeselectable
			label={ __( 'Letter case' ) }
			className={ clsx(
				'block-editor-text-transform-control',
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
