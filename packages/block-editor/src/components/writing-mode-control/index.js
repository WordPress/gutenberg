/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { textHorizontal, textVertical } from '@wordpress/icons';

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
 * @return {WPElement} Writing Mode control.
 */
export default function WritingModeControl( { className, value, onChange } ) {
	return (
		<fieldset
			className={ classnames(
				'block-editor-writing-mode-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Orientation' ) }
			</BaseControl.VisualLabel>
			<div className="block-editor-writing-mode-control__buttons">
				{ WRITING_MODES.map( ( writingMode ) => {
					return (
						<Button
							key={ writingMode.value }
							icon={ writingMode.icon }
							label={ writingMode.name }
							isPressed={ writingMode.value === value }
							onClick={ () => {
								onChange(
									writingMode.value === value
										? undefined
										: writingMode.value
								);
							} }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
