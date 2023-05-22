/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { arrowRight, arrowDown } from '@wordpress/icons';

const TEXT_ORIENTATIONS = [
	{
		name: __( 'Horizontal' ),
		value: 'horizontal-tb',
		icon: arrowRight,
	},
	{
		name: __( 'Vertical' ),
		value: isRTL() ? 'vertical-lr' : 'vertical-rl',
		icon: arrowDown,
	},
];

/**
 * Control to facilitate text orientation selections.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.className Class name to add to the control.
 * @param {string}   props.value     Currently selected text orientation.
 * @param {Function} props.onChange  Handles change in text orientation selection.
 *
 * @return {WPElement} Text orientation control.
 */
export default function TextOrientationControl( {
	className,
	value,
	onChange,
} ) {
	return (
		<fieldset
			className={ classnames(
				'block-editor-text-orientation-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Orientation' ) }
			</BaseControl.VisualLabel>
			<div className="block-editor-text-orientation-control__buttons">
				{ TEXT_ORIENTATIONS.map( ( textOrientation ) => {
					return (
						<Button
							key={ textOrientation.value }
							icon={ textOrientation.icon }
							label={ textOrientation.name }
							isPressed={ textOrientation.value === value }
							onClick={ () => {
								onChange(
									textOrientation.value === value
										? undefined
										: textOrientation.value
								);
							} }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
