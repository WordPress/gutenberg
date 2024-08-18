/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { textHorizontal, textVertical } from '@wordpress/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';

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
 * @param {Object}   props           Component props.
 * @param {string}   props.className Class name to add to the control.
 * @param {string}   props.value     Currently selected writing mode.
 * @param {Function} props.onChange  Handles change in the writing mode selection.
 *
 * @return {Element} Writing Mode control.
 */
export default function WritingModeControl( { className, value, onChange } ) {
	return (
		<ToggleGroupControl
			isDeselectable
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Orientation' ) }
			className={ clsx( 'block-editor-writing-mode-control', className ) }
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === value ? undefined : newValue );
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
