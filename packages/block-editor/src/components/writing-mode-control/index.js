/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { textHorizontal, textVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SegmentedTextControl from '../segmented-text-control';

const WRITING_MODES = [
	{
		name: __( 'Horizontal' ),
		value: 'horizontal-tb',
		icon: textHorizontal,
	},
	{
		name: __( 'Vertical' ),
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
		<SegmentedTextControl
			label={ __( 'Orientation' ) }
			controls={ WRITING_MODES }
			className={ className }
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === value ? undefined : newValue );
			} }
		/>
	);
}
