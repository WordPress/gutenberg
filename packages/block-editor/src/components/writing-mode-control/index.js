/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	textHorizontal,
	textHorizontalRTL,
	textUpright,
	textVertical,
	textVerticalRTL,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SegmentedTextControl from '../segmented-text-control';

const WRITING_MODES = [
	{
		name: __( 'Horizontal' ),
		value: 'horizontal',
		icon: isRTL() ? textHorizontalRTL : textHorizontal,
	},
	{
		name: __( 'Top to bottom' ),
		value: 'top-to-bottom',
		icon: isRTL() ? textVerticalRTL : textVertical,
	},
	{
		name: __( 'Upright' ),
		value: 'upright',
		icon: textUpright,
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
		<SegmentedTextControl
			label={ __( 'Orientation' ) }
			options={ WRITING_MODES }
			className={ clsx( 'block-editor-writing-mode-control', className ) }
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === value ? undefined : newValue );
			} }
		/>
	);
}
