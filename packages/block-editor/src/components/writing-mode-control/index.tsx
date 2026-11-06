import clsx from 'clsx';
import { __, isRTL } from '@wordpress/i18n';
import { textHorizontal, textVertical } from '@wordpress/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import type { WritingModeControlProps } from './types';

const WRITING_MODES = [
	{
		label: __( 'Horizontal' ),
		value: 'horizontal-tb',
		icon: textHorizontal,
	},
	{
		label: __( 'Vertical' ),
		value: isRTL() ? 'vertical-lr' : 'vertical-rl',
		icon: textVertical,
	},
];

/**
 * Control to facilitate writing mode selections.
 *
 * @param props           Component props.
 * @param props.className Class name to add to the control.
 * @param props.value     Currently selected writing mode.
 * @param props.onChange  Handles change in the writing mode selection.
 *
 * @return Writing Mode control.
 */
export default function WritingModeControl( {
	className,
	value,
	onChange,
}: WritingModeControlProps ) {
	return (
		<ToggleGroupControl
			isDeselectable
			label={ __( 'Orientation' ) }
			className={ clsx( 'block-editor-writing-mode-control', className ) }
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
			{ WRITING_MODES.map( ( option ) => {
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
